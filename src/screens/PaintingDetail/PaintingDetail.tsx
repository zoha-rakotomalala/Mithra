import React, { useState, useEffect } from 'react';
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
    toggleSeen,
    addToPalette,
    removeFromPalette,
    isPaintingInPalette,
    addPaintingToCollection,
  } = usePaintings();

  // Add painting to collection if it's from Met API (not already in collection)
  useEffect(() => {
    const exists = paintings.find(p => p.id === routePainting.id);
    if (!exists) {
      addPaintingToCollection(routePainting);
    }
  }, [routePainting.id]);

  // Get current state from context (this ensures we have latest data)
  const currentPainting = paintings.find(p => p.id === routePainting.id) || routePainting;
  const isInPalette = isPaintingInPalette(currentPainting.id);

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleToggleSeen = () => {
    toggleSeen(currentPainting.id);
  };

  const handleTogglePalette = () => {
    if (isInPalette) {
      removeFromPalette(currentPainting.id);
      Alert.alert('Removed from Palette', `${currentPainting.title} removed from your palette.`);
    } else {
      const success = addToPalette(currentPainting.id);
      if (success) {
        Alert.alert('Added to Palette!', `${currentPainting.title} added to your palette.`);
      } else {
        Alert.alert(
          'Palette Full',
          'Your palette can only hold 8 paintings. Remove one to add this painting.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleShare = () => {
    Alert.alert('Coming Soon', 'Share functionality will be available soon!');
  };

  // Extract the best quality image URL
  const getImageUrl = (painting: Painting): string | undefined => {
    // Met API paintings use imageUrl (already set by service)
    if (painting.imageUrl) {
      return painting.imageUrl;
    }
    return undefined;
  };

  const imageUrl = getImageUrl(currentPainting);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a4d3e" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Details</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            {imageUrl ? (
              <>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color="#2d6a4f" />
                    <Text style={styles.imageLoadingText}>Loading image...</Text>
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

            {/* Seen Badge */}
            {currentPainting.isSeen && (
              <View style={styles.seenBadge}>
                <Text style={styles.seenBadgeText}>✓ Seen</Text>
              </View>
            )}
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.paintingTitle}>{currentPainting.title}</Text>
            <Text style={styles.paintingArtist}>by {currentPainting.artist}</Text>
            {currentPainting.year && (
              <Text style={styles.paintingYear}>{currentPainting.year}</Text>
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
            <Text style={styles.sectionTitle}>DETAILS</Text>
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
          </View>

          {/* Location Section */}
          {currentPainting.museum && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LOCATION</Text>
              <Text style={styles.museumName}>{currentPainting.museum}</Text>
              {currentPainting.location && (
                <Text style={styles.museumLocation}>📍 {currentPainting.location}</Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                currentPainting.isSeen && styles.actionButtonActive,
              ]}
              onPress={handleToggleSeen}
            >
              <Text style={styles.actionButtonText}>
                {currentPainting.isSeen ? '✓ Marked as Seen' : 'Mark as Seen'}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  isInPalette && styles.actionButtonActive,
                ]}
                onPress={handleTogglePalette}
              >
                <Text style={styles.secondaryButtonText}>
                  {isInPalette ? '★ In Palette' : '☆ Add to Palette'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleShare}
              >
                <Text style={styles.secondaryButtonText}>↗ Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1a4d3e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  imageSection: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  paintingImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  imageLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imageErrorText: {
    fontSize: 14,
    color: '#999',
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
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '500',
  },
  seenBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  seenBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  paintingTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 36,
  },
  paintingArtist: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  paintingYear: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a4d3e',
    letterSpacing: 1.5,
    marginBottom: 16,
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
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
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
  actionSection: {
    padding: 24,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#1a4d3e',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a4d3e',
    flex: 1,
  },
  actionButtonActive: {
    backgroundColor: '#2d6a4f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButtonText: {
    color: '#1a4d3e',
    fontSize: 15,
    fontWeight: '600',
  },
});