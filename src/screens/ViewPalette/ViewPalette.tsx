import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, SafeAreaView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { getVisitPalette, getCachedPaintings, getVisitById } from '@/services';
import { EmptyState } from '@/components/molecules';
import { typography } from '@/styles';
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

  // Always 9 positions: 8 painting slots + center info tile
  const gridPositions = [0, 1, 2, 3, 'center', 4, 5, 6, 7];

  const renderGrid = () => (
    <View style={styles.grid}>
      {gridPositions.map((pos, idx) => {
        if (pos === 'center') {
          return (
            <View key="center" style={[styles.gridItem, styles.centerItem]}>
              <Text style={styles.centerTitle}>{visit?.museum?.name}</Text>
              <Text style={styles.centerDate}>{visit?.visit_date}</Text>
            </View>
          );
        }
        const painting = paintings[pos as number];
        if (!painting) {
          return (
            <View key={`empty-${idx}`} style={[styles.gridItem, styles.emptyItem]}>
              <Text style={styles.emptyIcon}>+</Text>
            </View>
          );
        }
        return (
          <View key={painting.id} style={styles.gridItem}>
            <Image source={{ uri: painting.image_url }} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.artist} numberOfLines={1}>{painting.artist}</Text>
            </View>
          </View>
        );
      })}
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
                {renderGrid()}
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
