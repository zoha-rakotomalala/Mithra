import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { usePaintings } from '@/contexts/PaintingsContext';
import { getVisitsForPainting } from '@/services/likes.service';
import { getCachedPainting } from '@/services/paintings.service';
import type { Painting as CachedPainting } from '@/types/database';

/**
 * Extracts all business logic from PaintingDetail screen:
 * - Resolves current painting from route params + collection
 * - Image loading state
 * - Visit provenance fetching
 * - Collection actions (quick add, toggle seen/wantToVisit, palette, remove)
 * - Navigation helpers
 */

function dbToUIPainting(db: CachedPainting): Painting {
  return {
    id: db.id,
    title: db.title,
    artist: db.artist,
    year: db.year,
    imageUrl: db.image_url,
    thumbnailUrl: db.thumbnail_url,
    color: db.color || '#1a1a1a',
    museum: db.museum_id,
    medium: db.medium,
    dimensions: db.dimensions,
  };
}

export function usePaintingDetail() {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { paintingId } = route.params as { paintingId: string };

  const {
    addToCollection,
    addToPalette,
    isInCollection,
    isPaintingInPalette,
    paintings,
    removeFromCollection,
    removeFromPalette,
    toggleSeen,
    toggleWantToVisit,
  } = usePaintings();

  const inCollection = isInCollection(paintingId);
  const collectionPainting = paintings.find(p => p.id === paintingId);

  const [remotePainting, setRemotePainting] = useState<Painting | null>(null);
  const [loading, setLoading] = useState(!collectionPainting);

  // Fetch from remote if not in collection
  useEffect(() => {
    if (collectionPainting) return;
    setLoading(true);
    getCachedPainting(paintingId).then(data => {
      if (data) setRemotePainting(dbToUIPainting(data));
      setLoading(false);
    });
  }, [paintingId, collectionPainting]);

  const currentPainting: Painting = collectionPainting || remotePainting || {
    id: paintingId,
    title: 'Loading...',
    artist: '',
    color: '#1a1a1a',
  };

  const isInPalette = isPaintingInPalette(currentPainting.id);

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [visitInfo, setVisitInfo] = useState<Array<{ visit_id: string; visit_date: string; museum_name: string }>>([]);

  useEffect(() => {
    getVisitsForPainting(paintingId).then(setVisitInfo);
  }, [paintingId]);

  const handleQuickAdd = (state: 'seen' | 'wantToVisit') => {
    const paintingToAdd = {
      ...currentPainting,
      dateAdded: new Date().toISOString(),
      isSeen: state === 'seen',
      seenDate: state === 'seen' ? new Date().toISOString() : undefined,
      wantToVisit: state === 'wantToVisit',
    };
    addToCollection(paintingToAdd);
  };

  const handleToggleSeen = () => {
    if (!inCollection) return;
    toggleSeen(currentPainting.id);
  };

  const handleToggleWantToVisit = () => {
    if (!inCollection) return;
    toggleWantToVisit(currentPainting.id);
  };

  const handleTogglePalette = () => {
    if (!inCollection) return;
    if (isInPalette) {
      removeFromPalette(currentPainting.id);
    } else {
      const success = addToPalette(currentPainting.id);
      if (!success) {
        Alert.alert('Palette Full', 'Your palette can only hold 8 paintings.', [{ text: 'OK' }]);
      }
    }
  };

  const handleRemoveFromCollection = () => {
    Alert.alert(
      'Remove from Collection',
      `Remove "${currentPainting.title}"?`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            removeFromCollection(currentPainting.id);
            navigation.goBack();
          },
          style: 'destructive',
          text: 'Remove'
        },
      ]
    );
  };

  const navigateToArtist = () => {
    navigation.navigate(Paths.ArtistProfile, { artistName: currentPainting.artist });
  };

  const navigateToVisit = (visitId: string) => {
    navigation.navigate(Paths.VisitDetail, { visitId });
  };

  const goBack = () => {
    navigation.goBack();
  };

  return {
    currentPainting,
    loading,
    inCollection,
    isInPalette,
    imageLoading,
    setImageLoading,
    imageError,
    setImageError,
    visitInfo,
    handleQuickAdd,
    handleToggleSeen,
    handleToggleWantToVisit,
    handleTogglePalette,
    handleRemoveFromCollection,
    navigateToArtist,
    navigateToVisit,
    goBack,
  };
}
