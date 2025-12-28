import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { usePaintings } from '@/contexts/PaintingsContext';

const { width, height } = Dimensions.get('window');

export function PaintingDetail({ route, navigation }: RootScreenProps<Paths.PaintingDetail>) {
  const { painting: routePainting } = route.params;
  const {
    paintings,
    toggleSeen,
    addToPalette,
    removeFromPalette,
    isPaintingInPalette,
    addPaintingToCollection,
    isPaintingInCollection,
  } = usePaintings();

  // Check if painting is in collection
  const inCollection = isPaintingInCollection(routePainting);

  // Get the current painting from context if it exists (for real-time updates)
  const painting = inCollection
    ? paintings.find(p =>
        p.title.toLowerCase() === routePainting.title.toLowerCase() &&
        p.artist.toLowerCase() === routePainting.artist.toLowerCase()
      ) || routePainting
    : routePainting;

  const isInPalette = inCollection ? isPaintingInPalette(painting.id) : false;

  const handleAddToCollection = () => {
    const success = addPaintingToCollection(routePainting);
    if (success) {
      Alert.alert(
        'Added to Collection!',
        `${routePainting.title} has been added to your collection.`,
        [
          { text: 'View Collection', onPress: () => navigation.goBack() },
          { text: 'OK' },
        ]
      );
    } else {
      Alert.alert('Already in Collection', 'This painting is already in your collection.');
    }
  };

  const handleToggleSeen = () => {
    if (!inCollection) {
      Alert.alert('Not in Collection', 'Add this painting to your collection first.');
      return;
    }
    toggleSeen(painting.id);
  };

  const handleTogglePalette = () => {
    if (!inCollection) {
      Alert.alert('Not in Collection', 'Add this painting to your collection first.');
      return;
    }

    if (isInPalette) {
      removeFromPalette(painting.id);
      Alert.alert('Removed', `${painting.title} removed from your Palette`);
    } else {
      const success = addToPalette(painting.id);
      if (success) {
        Alert.alert('Added', `${painting.title} added to your Palette!`);
      } else {
        Alert.alert('Palette Full', 'Your Palette can only hold 8 paintings. Remove one to add this.');
      }
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={painting.color} />
      <ScrollView style={styles.container} bounces={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Full painting display */}
        <View style={[styles.paintingContainer, { backgroundColor: painting.color }]}>
          <View style={styles.artFrame}>
            <Text style={styles.largeIcon}>🎨</Text>
          </View>

          {/* Seen badge */}
          {painting.isSeen && (
            <View style={styles.seenBadge}>
              <Text style={styles.seenBadgeText}>✓ Seen</Text>
            </View>
          )}
        </View>

        {/* Painting info */}
        <View style={styles.infoContainer}>
          {/* Title and artist */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{painting.title}</Text>
            <Text style={styles.artist}>by {painting.artist}</Text>
            {painting.year && (
              <Text style={styles.year}>{painting.year}</Text>
            )}
          </View>

          {/* Details */}
          {painting.description && (
            <View style={styles.section}>
              <Text style={styles.description}>{painting.description}</Text>
            </View>
          )}

          {/* Technical details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              {painting.medium && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Medium</Text>
                  <Text style={styles.detailValue}>{painting.medium}</Text>
                </View>
              )}
              {painting.dimensions && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dimensions</Text>
                  <Text style={styles.detailValue}>{painting.dimensions}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          {painting.museum && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationCard}>
                <Text style={styles.museumName}>{painting.museum}</Text>
                {painting.location && (
                  <Text style={styles.locationText}>📍 {painting.location}</Text>
                )}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionsSection}>
            {!inCollection ? (
              // Not in collection - show Add button
              <TouchableOpacity
                style={[styles.actionButton, styles.addToCollectionButton]}
                onPress={handleAddToCollection}
              >
                <Text style={styles.primaryButtonText}>
                  ➕ Add to Collection
                </Text>
              </TouchableOpacity>
            ) : (
              // In collection - show normal buttons
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryButton,
                    painting.isSeen && styles.primaryButtonActive,
                  ]}
                  onPress={handleToggleSeen}
                >
                  <Text style={styles.primaryButtonText}>
                    {painting.isSeen ? '✓ Marked as Seen' : 'Mark as Seen'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleTogglePalette}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isInPalette ? '★ In Palette' : '☆ Add to Palette'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleShare}
                  >
                    <Text style={styles.secondaryButtonText}>↗ Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#1a4d3e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a4d3e',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  paintingContainer: {
    width: width,
    height: width * 1.1,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paintingImage: {
    width: '100%',
    height: '100%',
  },
  paintingPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artFrame: {
    width: '80%',
    height: '70%',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artFrame: {
    width: '80%',
    height: '80%',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeIcon: {
    fontSize: 120,
    opacity: 0.9,
  },
  seenBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seenBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 34,
  },
  artist: {
    fontSize: 18,
    color: '#2d6a4f',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  year: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  locationCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
  },
  museumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2d6a4f',
  },
  primaryButtonActive: {
    backgroundColor: '#1a4d3e',
  },
  addToCollectionButton: {
    backgroundColor: '#2d6a4f',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    color: '#1a4d3e',
    fontSize: 14,
    fontWeight: '600',
  },
});