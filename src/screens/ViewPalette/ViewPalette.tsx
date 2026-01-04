import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getVisitPalette, getCachedPaintings, getVisitById } from '@/services';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { viewPaletteStyles as styles } from './styles';
import type { Painting as CachedPainting, Visit } from '@/types/database';

export function ViewPalette() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

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

    if (paletteData && paletteData.painting_ids.length === 8) {
      const cached = await getCachedPaintings(paletteData.painting_ids);
      setPaintings(cached);
    }

    setVisit(visitData);
    setLoading(false);
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
      <Text style={styles.centerTitle}>{visit?.museum_name}</Text>
      <Text style={styles.centerDate}>{visit?.visit_date}</Text>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>VISIT PALETTE</Text>
          <View style={shared.artDecoDivider} />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={typography.body}>Loading palette...</Text>
          </View>
        ) : paintings.length === 8 ? (
          <View style={styles.content}>
            <View style={styles.grid}>
              {paintings.slice(0, 3).map((p, i) => renderPainting(p, i))}
              {paintings.slice(3, 4).map((p, i) => renderPainting(p, i + 3))}
              {renderCenter()}
              {paintings.slice(4, 5).map((p, i) => renderPainting(p, i + 4))}
              {paintings.slice(5, 8).map((p, i) => renderPainting(p, i + 5))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={buttons.secondary}
                onPress={() => navigation.navigate(Paths.VisitPalette , { visitId } )}
              >
                <Text style={buttons.secondaryText}>Edit Palette</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎨</Text>
            <Text style={typography.h3}>No Palette Yet</Text>
            <Text style={typography.body}>Create a palette to see it here</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
