import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { usePaintings } from '@/contexts/PaintingsContext';
import type { Painting } from '@/types/painting';
import { Paths } from '@/navigation/paths';

export function PaintingDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { painting: routePainting } = route.params as { painting: Painting };

  const {
    paintings,
    isInCollection,
    addToCollection,
    removeFromCollection,
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

  const handleQuickAdd = (state: 'seen' | 'wantToVisit') => {
    const paintingToAdd = {
      ...currentPainting,
      isSeen: state === 'seen',
      wantToVisit: state === 'wantToVisit',
      dateAdded: new Date().toISOString(),
      seenDate: state === 'seen' ? new Date().toISOString() : undefined,
    };
    addToCollection(paintingToAdd);
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
        Alert.alert('Palette Full', 'Your palette can only hold 8 paintings.', [{ text: 'OK' }]);
      }
    }
  };

  const handleRemoveFromCollection = () => {
    Alert.alert(
      'Remove from Collection',
      `Remove "${currentPainting.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromCollection(currentPainting.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  const imageUrl = currentPainting.imageUrl;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Fixed Header with Actions */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {inCollection && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleToggleSeen}
                style={[styles.actionIcon, currentPainting.isSeen && styles.actionIconActive]}
              >
                <View style={styles.iconCircle}>
                  <Text style={[styles.iconText, currentPainting.isSeen && styles.iconTextActive]}>S</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleWantToVisit}
                style={[styles.actionIcon, currentPainting.wantToVisit && styles.actionIconActive]}
              >
                <View style={styles.iconCircle}>
                  <Text style={[styles.iconText, currentPainting.wantToVisit && styles.iconTextActive]}>W</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTogglePalette}
                style={[styles.actionIcon, isInPalette && styles.actionIconActive]}
              >
                <View style={styles.iconCircle}>
                  <Text style={[styles.iconText, isInPalette && styles.iconTextActive]}>P</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRemoveFromCollection} style={styles.deleteIcon}>
                <View style={styles.iconCircle}>
                  <Text style={styles.deleteText}>×</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            {imageUrl ? (
              <>
                {imageLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a4d3e" />
                  </View>
                )}
                <FastImage
                  source={{
                    uri: imageUrl,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.contain}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
                {imageError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Unable to load image</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: currentPainting.color }]}>
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
          </View>

          {/* Quick Add Section */}
          {!inCollection && (
            <View style={styles.quickAddSection}>
              <Text style={styles.quickAddTitle}>Add to Collection</Text>
              <View style={styles.quickAddRow}>
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => handleQuickAdd('seen')}
                >
                  <Text style={styles.quickAddLabel}>Seen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => handleQuickAdd('wantToVisit')}
                >
                  <Text style={styles.quickAddLabel}>Want to Visit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Title Section */}
          <View style={styles.infoSection}>
            <Text style={styles.title}>{currentPainting.title}</Text>
            <TouchableOpacity onPress={() => navigation.navigate(Paths.ArtistProfile, { artistName: currentPainting.artist })}>
              <Text style={styles.artist}>{currentPainting.artist}</Text>
            </TouchableOpacity>
            {currentPainting.year && (
              <Text style={styles.year}>{currentPainting.year}</Text>
            )}

            {/* Status Tags */}
            {inCollection && (
              <View style={styles.tags}>
                {currentPainting.isSeen && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Seen</Text>
                  </View>
                )}
                {currentPainting.wantToVisit && (
                  <View style={[styles.tag, styles.tagWant]}>
                    <Text style={styles.tagText}>Want to Visit</Text>
                  </View>
                )}
                {isInPalette && (
                  <View style={[styles.tag, styles.tagPalette]}>
                    <Text style={styles.tagText}>In Palette</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Description */}
          {currentPainting.description && (
            <View style={styles.section}>
              <Text style={styles.description}>{currentPainting.description}</Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            {currentPainting.medium && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Medium</Text>
                <Text style={styles.value}>{currentPainting.medium}</Text>
              </View>
            )}
            {currentPainting.dimensions && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Dimensions</Text>
                <Text style={styles.value}>{currentPainting.dimensions}</Text>
              </View>
            )}
            {currentPainting.year && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Year</Text>
                <Text style={styles.value}>{currentPainting.year}</Text>
              </View>
            )}
          </View>

          {/* Location */}
          {currentPainting.museum && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.museum}>{currentPainting.museum}</Text>
              {currentPainting.location && (
                <Text style={styles.location}>{currentPainting.location}</Text>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#1a4d3e',
    fontWeight: '300',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    opacity: 0.4,
  },
  actionIconActive: {
    opacity: 1,
  },
  deleteIcon: {
    opacity: 0.4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  iconTextActive: {
    color: '#1a4d3e',
  },
  deleteText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#666',
  },
  imageSection: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  quickAddSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  quickAddTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a4d3e',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1a4d3e',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAddLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 32,
  },
  artist: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
  },
  tagWant: {
    backgroundColor: '#fff3e0',
  },
  tagPalette: {
    backgroundColor: '#e3f2fd',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a4d3e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  museum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
});