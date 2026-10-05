import { useCallback, useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';

import type { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { usePaintings } from '@/contexts/PaintingsContext';
import { TIER_1_MUSEUMS } from '@/services/museumRegistry';
import {
  getLikedUuidsForVisit,
  likePainting,
  unlikePainting,
} from '@/services/likes.service';
import { runScanSearch } from '@/services/scanMatchService';
import { resolveIdentifier } from '@/services/identification';

/** UI phase for the scan screen. */
export type ScanPhase =
  | 'idle'
  | 'analyzing'
  | 'searching'
  | 'results'
  | 'noMatch'
  | 'error';

/** Museums scanned against. Tier 1 gives the best precision/latency balance. */
const SCAN_MUSEUMS = TIER_1_MUSEUMS;

const IMAGE_PICKER_OPTIONS = {
  includeBase64: true,
  maxHeight: 1024,
  maxWidth: 1024,
  mediaType: 'photo' as const,
  quality: 0.7 as const,
};

async function ensureAndroidCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
        message: 'Palette needs your camera to photograph and identify artwork.',
        title: 'Camera Permission',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function useScanPainting() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { visitId } =
    (route.params as { visitId?: string } | undefined) ?? {};

  const { addToCollection, isInCollection, toggleSeen } = usePaintings();

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [matches, setMatches] = useState<Painting[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Preload liked painting UUIDs when scanning within a visit context.
  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;
    getLikedUuidsForVisit(visitId).then((ids) => {
      if (!cancelled) setLikedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  const runVisionPipeline = useCallback(
    async (asset: Asset) => {
      if (!asset.base64) {
        setPhase('error');
        setErrorMessage('Could not read the captured image. Please try again.');
        return;
      }

      setPreviewUri(asset.uri ?? null);
      setPhase('analyzing');
      setErrorMessage(null);

      try {
        const identifier = resolveIdentifier();
        const candidates = await identifier.identify(asset.base64);

        if (candidates.length === 0) {
          setMatches([]);
          setPhase('noMatch');
          return;
        }

        setPhase('searching');
        const found = await runScanSearch(candidates, SCAN_MUSEUMS);
        setMatches(found);
        setPhase(found.length > 0 ? 'results' : 'noMatch');
      } catch (error) {
        setPhase('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Something went wrong while identifying the artwork.',
        );
      }
    },
    [],
  );

  const scanWithCamera = useCallback(async () => {
    const permitted = await ensureAndroidCameraPermission();
    if (!permitted) {
      Alert.alert(
        'Camera Permission Needed',
        'Enable camera access in Settings to scan artwork.',
        [{ text: 'OK' }],
      );
      return;
    }
    const result = await launchCamera(IMAGE_PICKER_OPTIONS);
    if (result.didCancel) return;
    if (result.errorCode) {
      setPhase('error');
      setErrorMessage(result.errorMessage ?? 'Could not open the camera.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) await runVisionPipeline(asset);
  }, [runVisionPipeline]);

  const scanFromLibrary = useCallback(async () => {
    const result = await launchImageLibrary(IMAGE_PICKER_OPTIONS);
    if (result.didCancel) return;
    if (result.errorCode) {
      setPhase('error');
      setErrorMessage(result.errorMessage ?? 'Could not open the library.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) await runVisionPipeline(asset);
  }, [runVisionPipeline]);

  const reset = useCallback(() => {
    setPhase('idle');
    setMatches([]);
    setErrorMessage(null);
    setPreviewUri(null);
  }, []);

  const handlePaintingPress = useCallback(
    (painting: Painting) => {
      navigation.navigate(Paths.PaintingDetail, { paintingId: painting.id });
    },
    [navigation],
  );

  // Like bridge — identical semantics to the Search screen's handleLike, so a
  // scan during a visit behaves exactly like finding the piece via Search.
  const handleLike = useCallback(
    async (painting: Painting) => {
      if (!visitId) return;
      const paintingId = painting.id;
      if (likedIds.has(paintingId)) {
        await unlikePainting(paintingId, visitId);
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(paintingId);
          return next;
        });
      } else {
        await likePainting(paintingId, visitId);
        setLikedIds((prev) => new Set(prev).add(paintingId));
        if (!isInCollection(paintingId)) {
          addToCollection({ ...painting, isSeen: true, wantToVisit: false });
        } else {
          toggleSeen(paintingId);
        }
      }
    },
    [visitId, likedIds, addToCollection, isInCollection, toggleSeen],
  );

  const isLiked = useCallback(
    (painting: Painting) => likedIds.has(painting.id),
    [likedIds],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    errorMessage,
    goBack,
    handleLike,
    handlePaintingPress,
    isLiked,
    matches,
    phase,
    previewUri,
    reset,
    scanFromLibrary,
    scanWithCamera,
    visitId,
  };
}
