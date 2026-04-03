import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Alert, SafeAreaView, Image, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getLikedPaintingsForVisit, getCachedPaintings, saveVisitPalette, getVisitPalette } from '@/services';
import { EmptyState } from '@/components/molecules';
import { buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { visitPaletteStyles as styles } from './VisitPalette.styles';
import type { Painting as CachedPainting } from '@/types/database';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - SPACING.md * 2 - SPACING.sm * 2) / 3;

export function VisitPalette() {
  const navigation = useNavigation();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPalette();
  }, [visitId]);

  const loadPalette = async () => {
    const existingPalette = await getVisitPalette(visitId);
    if (existingPalette) {
      setSelected(new Set(existingPalette.paintings.map(p => p.painting_id)));
    }

    const likes = await getLikedPaintingsForVisit(visitId);
    const paintingIds = likes.map(like => like.painting_id);
    if (paintingIds.length > 0) {
      const cached = await getCachedPaintings(paintingIds);
      setPaintings(cached);
    }
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
    if (selected.size === 0) {
      Alert.alert('Select Artworks', 'Please select at least one artwork for your palette.');
      return;
    }
    await saveVisitPalette(visitId, Array.from(selected));
    navigation.goBack();
  };

  const renderPainting = ({ item }: { item: CachedPainting }) => {
    const isSelected = selected.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleSelect(item.id)}
        style={[styles.selectCard, { width: CARD_SIZE }]}
      >
        <View style={[styles.selectImageWrap, isSelected && styles.selectImageSelected]}>
          <Image
            source={{ uri: item.thumbnail_url || item.image_url }}
            style={styles.selectImage}
            resizeMode="cover"
          />
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.selectTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.selectArtist} numberOfLines={1}>{item.artist}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CREATE PALETTE</Text>
        </View>
        <Text style={styles.subtitle}>Select up to 8 artworks ({selected.size}/8)</Text>
      </View>

      {paintings.length === 0 ? (
        <EmptyState
          icon="🎨"
          title="No Liked Artworks"
          subtitle="Like artworks first to create a palette"
        />
      ) : (
        <>
          <FlatList
            data={paintings}
            extraData={Array.from(selected).join(',')}
            renderItem={renderPainting}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.md }}
            contentContainerStyle={{ paddingTop: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.sm }}
            style={{ backgroundColor: COLORS.cream }}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[buttons.primary, selected.size === 0 && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={selected.size === 0}
            >
              <Text style={buttons.primaryText}>Save Palette</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
