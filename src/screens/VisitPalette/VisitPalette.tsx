import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getLikedPaintingsForVisit, getCachedPaintings, saveVisitPalette, getVisitPalette } from '@/services';
import { GridPaintingCard, EmptyState } from '@/components/molecules';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING, GRID } from '@/constants';
import { visitPaletteStyles as styles } from './VisitPalette.styles';
import type { Painting as CachedPainting } from '@/types/database';
import type { Painting } from '@/types/painting';

export function VisitPalette() {
  const navigation = useNavigation();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPalette();
  }, [visitId]);

  const loadPalette = async () => {
    setLoading(true);
    
    // Get existing palette
    const existingPalette = await getVisitPalette(visitId);
    if (existingPalette) {
      setSelected(new Set(existingPalette.painting_ids));
    }

    // Get liked paintings
    const likes = await getLikedPaintingsForVisit(visitId);
    const paintingIds = likes.map(like => like.painting_id);
    
    if (paintingIds.length > 0) {
      const cached = await getCachedPaintings(paintingIds);
      setPaintings(cached);
    }
    
    setLoading(false);
  };

  const toggleSelect = (paintingId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(paintingId)) {
        next.delete(paintingId);
      } else if (next.size < 8) {
        next.add(paintingId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size !== 8) {
      Alert.alert('Select 8 Artworks', 'Please select exactly 8 artworks for your palette.');
      return;
    }

    await saveVisitPalette(visitId, Array.from(selected));
    Alert.alert('Palette Saved!', 'Your visit palette has been created.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const renderPainting = ({ item }: { item: CachedPainting }) => {
    const isSelected = selected.has(item.id);
    const painting: Painting = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      year: item.year ? parseInt(item.year) : undefined,
      imageUrl: item.image_url,
      museum: item.museum_id,
      color: '#1a1a1a',
    };

    return (
      <TouchableOpacity onPress={() => toggleSelect(item.id)}>
        <View style={[styles.cardWrapper, isSelected && styles.cardSelected]}>
          <GridPaintingCard variant="minimal" painting={painting} onPress={() => {}} />
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>CREATE PALETTE</Text>
          <Text style={styles.subtitle}>Select 8 artworks ({selected.size}/8)</Text>
          <View style={shared.artDecoDivider} />
        </View>

        {paintings.length === 0 ? (
          <EmptyState
            icon="��"
            title="No Liked Artworks"
            subtitle="Like artworks first to create a palette"
          />
        ) : (
          <>
            <FlatList
              data={paintings}
              renderItem={renderPainting}
              keyExtractor={(item) => item.id}
              numColumns={GRID.columns}
              columnWrapperStyle={{ gap: GRID.gutter }}
              contentContainerStyle={{ padding: GRID.margin, gap: GRID.gutter }}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                style={[buttons.primary, selected.size !== 8 && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={selected.size !== 8}
              >
                <Text style={buttons.primaryText}>Save Palette</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
}
