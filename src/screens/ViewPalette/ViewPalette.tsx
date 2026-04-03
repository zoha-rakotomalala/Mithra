import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, Platform, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { getVisitPalette, getCachedPaintings, getVisitById } from '@/services';
import { PaletteTile, EmptyPaletteTile } from '@/components/molecules/PaletteTile';
import { EmptyState } from '@/components/molecules';
import { typography } from '@/styles';
import { COLORS } from '@/constants';
import { viewPaletteStyles as styles } from './ViewPalette.styles';
import type { Painting as CachedPainting, Visit } from '@/types/database';
import type { Painting } from '@/types/painting';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 64) / 3;

export function ViewPalette() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };
  const viewShotRef = useRef<ViewShot>(null);

  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPalette();
  }, [visitId]);

  const loadPalette = async () => {
    setLoading(true);
    const [paletteData, visitData] = await Promise.all([
      getVisitPalette(visitId),
      getVisitById(visitId)
    ]);
    if (paletteData && paletteData.paintings.length > 0) {
      const paintingIds = paletteData.paintings.map(p => p.painting_id);
      const cached = await getCachedPaintings(paintingIds);
      setPaintings(cached);
    }
    setVisit(visitData);
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;
      await RNShare.open({
        title: `My Palette — ${visit?.museum?.name ?? 'Visit'}`,
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
        type: 'image/png',
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        console.error('Error sharing palette:', err);
      }
    }
  };

  const toUIPainting = (db: CachedPainting): Painting => ({
    id: db.id,
    title: db.title,
    artist: db.artist,
    year: db.year,
    imageUrl: db.image_url,
    thumbnailUrl: db.thumbnail_url,
    color: db.color || '#1a1a1a',
    museum: db.museum_id,
  });

  const gridPositions = [0, 1, 2, 3, 'center', 4, 5, 6, 7];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.cream }}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>VISIT PALETTE</Text>
            <View style={{ flex: 1 }} />
            {paintings.length > 0 && (
              <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
                <Text style={styles.headerActionIcon}>⎘</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate(Paths.VisitPalette, { visitId })}
              style={styles.headerAction}
            >
              <Text style={styles.headerActionIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={typography.body}>Loading palette...</Text>
          </View>
        ) : paintings.length > 0 ? (
          <View style={styles.content}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.shareableGrid}>
                <View style={styles.grid}>
                  {gridPositions.map((pos, idx) => {
                    if (pos === 'center') {
                      return (
                        <View key="center" style={styles.centerItem}>
                          <Text style={styles.centerTitle}>{visit?.museum?.name}</Text>
                          <Text style={styles.centerDate}>{visit?.visit_date}</Text>
                        </View>
                      );
                    }
                    const painting = paintings[pos as number];
                    if (!painting) {
                      return <EmptyPaletteTile key={`empty-${idx}`} size={TILE_SIZE} />;
                    }
                    return (
                      <PaletteTile
                        key={painting.id}
                        imageUrl={painting.image_url}
                        title={painting.title}
                        artist={painting.artist}
                        onPress={() => navigation.navigate(Paths.PaintingDetail, { painting: toUIPainting(painting) })}
                        size={TILE_SIZE}
                      />
                    );
                  })}
                </View>
              </View>
            </ViewShot>
          </View>
        ) : (
          <EmptyState
            icon="🎨"
            title="No Palette Yet"
            subtitle="Create a palette to see it here"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
