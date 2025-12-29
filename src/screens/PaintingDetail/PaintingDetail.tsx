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

  // Check if in collection
  const inCollection = isInCollection(routePainting.id);

  // Get current state from context if in collection
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
      `${currentPainting.title} has been added to your collection.`,
      [{ text: 'OK' }]
    );
  };

  const handleToggleSeen = () => {
    if (!inCollection) {
      Alert.alert(
        'Add to Collection First',
        'Please add this painting to your collection before marking it as seen.',
        [{ text: 'OK' }]
      );
      return;
    }
    toggleSeen(currentPainting.id);
  };

  const handleToggleWantToVisit = () => {
    if (!inCollection) {
      Alert.alert(
        'Add to Collection First',
        'Please add this painting to your collection first.',
        [{ text: 'OK' }]
      );
      return;
    }
    toggleWantToVisit(currentPainting.id);
  };

  const handleTogglePalette = () => {
    if (!inCollection) {
      Alert.alert(
        'Add to Collection First',
        'Please add this painting to your collection before adding it to your palette.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  const imageUrl = currentPainting.imageUrl;

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
            <Text style={styles.backButtonText}>← Back</Text>
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

            {/* Status Badges */}
            {inCollection && (
              <View style={styles.badgeContainer}>
                {currentPainting.isSeen && (
                  <View style={styles.seenBadge}>
                    <Text style={styles.badgeText}>✓ Seen</Text>
                  </View>
                )}
                {currentPainting.wantToVisit && (
                  <View style={styles.wantToVisitBadge}>
                    <Text style={styles.badgeText}>⭐ Want to Visit</Text>
                  </View>
                )}
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
            {/* Primary Action: Add to Collection */}
            {!inCollection && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleAddToCollection}
              >
                <Text style={styles.actionButtonText}>➕ Add to Collection</Text>
              </TouchableOpacity>
            )}

            {/* Collection Status */}
            {inCollection && (
              <View style={styles.collectionStatusBanner}>
                <Text style={styles.collectionStatusText}>✓ In your collection</Text>
              </View>
            )}

            {/* Secondary Actions */}
            <View style={styles.secondaryButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  currentPainting.isSeen && styles.actionButtonActive,
                  !inCollection && styles.actionButtonDisabled,
                ]}
                onPress={handleToggleSeen}
                disabled={!inCollection}
              >
                <Text style={[
                  styles.secondaryButtonText,
                  !inCollection && styles.disabledButtonText
                ]}>
                  {currentPainting.isSeen ? '✓ Seen' : '👁️ Mark as Seen'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  currentPainting.wantToVisit && styles.actionButtonActive,
                  !inCollection && styles.actionButtonDisabled,
                ]}
                onPress={handleToggleWantToVisit}
                disabled={!inCollection}
              >
                <Text style={[
                  styles.secondaryButtonText,
                  !inCollection && styles.disabledButtonText
                ]}>
                  {currentPainting.wantToVisit ? '⭐ Want to Visit' : '⭐ Want to Visit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Palette Action */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.paletteButton,
                isInPalette && styles.actionButtonActive,
                !inCollection && styles.actionButtonDisabled,
              ]}
              onPress={handleTogglePalette}
              disabled={!inCollection}
            >
              <Text style={[
                styles.paletteButtonText,
                !inCollection && styles.disabledButtonText
              ]}>
                {isInPalette ? '★ In Palette' : '☆ Add to Palette'}
              </Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <Text style={styles.shareButtonText}>↗ Share</Text>
            </TouchableOpacity>
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
  badgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 8,
  },
  seenBadge: {
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
  wantToVisitBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
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
  collectionStatusBanner: {
    backgroundColor: '#f0f7f4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
  },
  collectionStatusText: {
    fontSize: 14,
    color: '#1a4d3e',
    fontWeight: '600',
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
  secondaryButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a4d3e',
    flex: 1,
  },
  paletteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2d6a4f',
  },
  shareButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonActive: {
    backgroundColor: '#2d6a4f',
  },
  actionButtonDisabled: {
    opacity: 0.3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#1a4d3e',
    fontSize: 15,
    fontWeight: '600',
  },
  paletteButtonText: {
    color: '#2d6a4f',
    fontSize: 15,
    fontWeight: '600',
  },
  shareButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
});