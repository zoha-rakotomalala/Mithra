import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, SafeAreaView, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import { getVisitPalette, getCachedPaintings, getVisitById } from '@/services';
import { EmptyState } from '@/components/molecules';
import { buttons, typography } from '@/styles';
import { COLORS } from '@/constants';
import { viewPaletteStyles as styles } from './ViewPalette.styles';
import type { Painting as CachedPainting, Visit } from '@/types/database';

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

    if (paletteData && paletteData.paintings.length === 8) {
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
      await Share.share({
        title: `My Palette — ${visit?.museum?.name ?? 'Visit'}`,
        url: uri,
      });
    } catch (err) {
      console.error('Error sharing palette:', err);
    }
  };

  const renderPainting = (painting: CachedPainting, index: number) => (
    <View key={painting.id} style={styles.gridItem}>
      <Image source={{ uri: painting.image_url }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.artist} numberOfLines={1}>{painting.artist}</Text>
      </View>
    </View>
  );

  const renderCenter = () => (
    <View style={[styles.gridItem, styles.centerItem]}>
      <Text style={styles.centerTitle}>{visit?.museum?.name}</Text>
      <Text style={styles.centerDate}>{visit?.visit_date}</Text>
    </View>
  );

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
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={typography.body}>Loading palette...</Text>
          </View>
        ) : paintings.length === 8 ? (
          <View style={styles.content}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.shareableGrid}>
                <View style={styles.grid}>
                  {paintings.slice(0, 3).map((p, i) => renderPainting(p, i))}
                  {paintings.slice(3, 4).map((p, i) => renderPainting(p, i + 3))}
                  {renderCenter()}
                  {paintings.slice(4, 5).map((p, i) => renderPainting(p, i + 4))}
                  {paintings.slice(5, 8).map((p, i) => renderPainting(p, i + 5))}
                </View>
              </View>
            </ViewShot>

            <View style={styles.actions}>
              <TouchableOpacity
                style={buttons.primary}
                onPress={handleShare}
              >
                <Text style={buttons.primaryText}>Share Palette</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={buttons.secondary}
                onPress={() => navigation.navigate(Paths.VisitPalette, { visitId })}
              >
                <Text style={buttons.secondaryText}>Edit Palette</Text>
              </TouchableOpacity>
            </View>
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
