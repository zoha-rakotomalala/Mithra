import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getVisits, getVisitPalette, getCachedPaintings, saveCanonPalette, getCanonPalette } from '@/services';
import { GridPaintingCard, EmptyState } from '@/components/molecules';
import { shared, buttons } from '@/styles';
import { COLORS, SPACING, GRID } from '@/constants';
import { canonPaletteStyles as styles } from './CanonPalette.styles';
import type { Painting as CachedPainting } from '@/types/database';
import type { Painting } from '@/types/painting';

export function CanonPalette() {
  const navigation = useNavigation();
  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllPalettes();
  }, []);

  const loadAllPalettes = async () => {
    setLoading(true);
    
    // Get existing canon
    const existingCanon = await getCanonPalette();
    if (existingCanon) {
      setSelected(new Set(existingCanon.painting_ids));
    }

    // Get all visits
    const visits = await getVisits();
    
    // Get all visit palettes
    const allPaintingIds = new Set<string>();
    for (const visit of visits) {
      const palette = await getVisitPalette(visit.id);
      if (palette) {
        palette.painting_ids.forEach(id => allPaintingIds.add(id));
      }
    }

    // Load paintings
    if (allPaintingIds.size > 0) {
      const cached = await getCachedPaintings(Array.from(allPaintingIds));
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
      Alert.alert('Select 8 Artworks', 'Please select exactly 8 artworks for your canon.');
      return;
    }

    await saveCanonPalette(Array.from(selected));
    Alert.alert('Canon Saved!', 'Your ultimate collection has been created.', [
      { text: 'View', onPress: () => navigation.navigate('viewCanon' as never) }
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={shared.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CANON PALETTE</Text>
          </View>
          <Text style={styles.subtitle}>Select your ultimate 8 ({selected.size}/8)</Text>
        </View>

        {paintings.length === 0 ? (
          <EmptyState
            icon="🎨"
            title="No Visit Palettes"
            subtitle="Create visit palettes first"
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
                <Text style={buttons.primaryText}>Save Canon</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
}
