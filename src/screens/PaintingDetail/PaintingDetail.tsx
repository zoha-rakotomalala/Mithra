import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePaintings } from '@/contexts/PaintingsContext';
import type { Painting } from '@/types/painting';

export function PaintingDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { painting: routePainting } = route.params as { painting: Painting };

  const {
    paintings,
    isInCollection,
    addToCollection,
    toggleSeen,
    toggleWantToVisit,
    addToPalette,
    removeFromPalette,
    isPaintingInPalette,
  } = usePaintings();

  const inCollection = isInCollection(routePainting.id);
  const currentPainting = inCollection
    ? paintings.find(p => p.id === routePainting.id) || routePainting
    : routePainting;

  const isInPalette = isPaintingInPalette(currentPainting.id);

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleAddToCollection = () => {
    addToCollection(currentPainting);
    Alert.alert(
      'Added to Collection!',
      `${currentPainting.title} has been added with "Want to Visit" status.`,
      [{ text: 'OK' }]
    );
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
        Alert.alert(
          'Palette Full',
          'Your palette can only hold 8 paintings. Remove one to add this painting.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const imageUrl = currentPainting.imageUrl;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" translucent />
      <View style={styles.container}>
        {/* Instagram-Style Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {inCollection && (
              <>
                {/* Want to Visit */}
                <TouchableOpacity
                  onPress={handleToggleWantToVisit}
                  style={[
                    styles.headerIconButton,
                    currentPainting.wantToVisit && styles.headerIconButtonActive
                  ]}
                >
                  <Text style={styles.headerIconText}>⭐</Text>
                </TouchableOpacity>

                {/* Seen (Heart) */}
                <TouchableOpacity
                  onPress={handleToggleSeen}
                  style={[
                    styles.headerIconButton,
                    currentPainting.isSeen && styles.headerIconButtonActive
                  ]}
                >
                  <Text style={styles.headerIconText}>
                    {currentPainting.isSeen ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>

                {/* Palette */}
                <TouchableOpacity
                  onPress={handleTogglePalette}
                  style={[
                    styles.headerIconButton,
                    isInPalette && styles.headerIconButtonActive
                  ]}
                >
                  <Text style={styles.headerIconText}>
                    {isInPalette ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            {imageUrl ? (
              <>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color="#2d6a4f" />
                  </View>
                )}
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.paintingImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
                {imageError && (
                  <View style={styles.imageErrorContainer}>
                    <Text style={styles.imageErrorText}>Unable to load image</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: currentPainting.color }]}>
                <Text style={styles.placeholderIcon}>🎨</Text>
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
          </View>

          {/* Add to Collection CTA */}
          {!inCollection && (
            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddToCollection}
              >
                <Text style={styles.addButtonText}>➕ Add to Collection</Text>
              </TouchableOpacity>
              <Text style={styles.ctaHint}>
                Add to your collection to mark as seen, want to visit, or add to palette
              </Text>
            </View>
          )}

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.paintingTitle}>{currentPainting.title}</Text>
            <Text style={styles.paintingArtist}>{currentPainting.artist}</Text>
            {currentPainting.year && (
              <Text style={styles.paintingYear}>{currentPainting.year}</Text>
            )}

            {/* Status Pills */}
            {inCollection && (
              <View style={styles.statusPills}>
                {currentPainting.isSeen && (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>❤️ Seen & Loved</Text>
                  </View>
                )}
                {currentPainting.wantToVisit && (
                  <View style={[styles.statusPill, styles.statusPillWant]}>
                    <Text style={styles.statusPillText}>⭐ Want to Visit</Text>
                  </View>
                )}
                {isInPalette && (
                  <View style={[styles.statusPill, styles.statusPillPalette]}>
                    <Text style={styles.statusPillText}>★ In Palette</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Description */}
          {currentPainting.description && (
            <View style={styles.section}>
              <Text style={styles.descriptionText}>{currentPainting.description}</Text>
            </View>
          )}

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            {currentPainting.medium && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medium</Text>
                <Text style={styles.detailValue}>{currentPainting.medium}</Text>
              </View>
            )}

            {currentPainting.dimensions && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dimensions</Text>
                <Text style={styles.detailValue}>{currentPainting.dimensions}</Text>
              </View>
            )}

            {currentPainting.year && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Year</Text>
                <Text style={styles.detailValue}>{currentPainting.year}</Text>
              </View>
            )}
          </View>

          {/* Location Section */}
          {currentPainting.museum && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.museumName}>{currentPainting.museum}</Text>
              {currentPainting.location && (
                <Text style={styles.museumLocation}>📍 {currentPainting.location}</Text>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerIconText: {
    fontSize: 20,
  },
  imageSection: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    marginTop: 100,
  },
  paintingImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  imageErrorText: {
    fontSize: 14,
    color: '#666',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 12,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  ctaSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  addButton: {
    backgroundColor: '#1a4d3e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  titleSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  paintingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 32,
  },
  paintingArtist: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  paintingYear: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  statusPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusPillWant: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  statusPillPalette: {
    backgroundColor: '#f0f7f4',
    borderColor: '#a7f3d0',
  },
  statusPillText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  section: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a4d3e',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  museumName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  museumLocation: {
    fontSize: 15,
    color: '#666',
  },
});