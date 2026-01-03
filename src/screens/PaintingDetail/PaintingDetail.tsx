import type { Painting } from '@/types/painting';

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { Paths } from '@/navigation/paths';

import { usePaintings } from '@/contexts/PaintingsContext';

export function PaintingDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { painting: routePainting } = route.params as { painting: Painting };

  const {
    addToCollection,
    addToPalette,
    isInCollection,
    isPaintingInPalette,
    paintings,
    removeFromCollection,
    removeFromPalette,
    toggleSeen,
    toggleWantToVisit,
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
      dateAdded: new Date().toISOString(),
      isSeen: state === 'seen',
      seenDate: state === 'seen' ? new Date().toISOString() : undefined,
      wantToVisit: state === 'wantToVisit',
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
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            removeFromCollection(currentPainting.id);
            navigation.goBack();
          },
          style: 'destructive',
          text: 'Remove'
        },
      ]
    );
  };

  const navigateToArtist = () => {
    navigation.navigate(Paths.ArtistProfile, { artistName: currentPainting.artist });
  };

  const imageUrl = currentPainting.imageUrl;

  return (
    <>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { navigation.goBack(); }} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {inCollection ? <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleToggleSeen}
                style={[styles.actionButton, currentPainting.isSeen && styles.actionButtonActive]}
              >
                <Text style={[styles.actionText, currentPainting.isSeen && styles.actionTextActive]}>S</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleWantToVisit}
                style={[styles.actionButton, currentPainting.wantToVisit && styles.actionButtonActive]}
              >
                <Text style={[styles.actionText, currentPainting.wantToVisit && styles.actionTextActive]}>W</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTogglePalette}
                style={[styles.actionButton, isInPalette && styles.actionButtonActive]}
              >
                <Text style={[styles.actionText, isInPalette && styles.actionTextActive]}>P</Text>
              </TouchableOpacity>

              <View style={styles.dividerVertical} />

              <TouchableOpacity onPress={handleRemoveFromCollection} style={styles.deleteButton}>
                <Text style={styles.deleteText}>×</Text>
              </TouchableOpacity>
            </View> : null}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Black Gallery Background for Image */}
          <View style={styles.gallerySection}>
            {/* Art Deco Corner Ornaments */}
            <View style={styles.cornerTopLeft}>
              <Text style={styles.cornerOrnament}>◆</Text>
            </View>
            <View style={styles.cornerTopRight}>
              <Text style={styles.cornerOrnament}>◆</Text>
            </View>

            {imageUrl ? (
              <>
                {imageLoading ? <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#d4af37" size="large" />
                    <Text style={styles.loadingText}>Loading artwork...</Text>
                  </View> : null}
                <FastImage
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  onLoadEnd={() => { setImageLoading(false); }}
                  onLoadStart={() => { setImageLoading(true); }}
                  resizeMode={FastImage.resizeMode.contain}
                  source={{
                    cache: FastImage.cacheControl.immutable,
                    priority: FastImage.priority.high,
                    uri: imageUrl,
                  }}
                  style={styles.image}
                />
                {imageError ? <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Unable to load artwork</Text>
                    <Text style={styles.errorSubtext}>Image may be unavailable</Text>
                  </View> : null}
              </>
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: currentPainting.color }]}>
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}

            <View style={styles.cornerBottomLeft}>
              <Text style={styles.cornerOrnament}>◆</Text>
            </View>
            <View style={styles.cornerBottomRight}>
              <Text style={styles.cornerOrnament}>◆</Text>
            </View>
          </View>

          {/* Quick Add Section - Art Deco Style */}
          {!inCollection && (
            <View style={styles.quickAddSection}>
              <View style={styles.quickAddDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ADD TO COLLECTION</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.quickAddRow}>
                <TouchableOpacity
                  onPress={() => { handleQuickAdd('seen'); }}
                  style={styles.artDecoButton}
                >
                  <Text style={styles.artDecoButtonText}>SEEN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { handleQuickAdd('wantToVisit'); }}
                  style={[styles.artDecoButton, styles.artDecoButtonSecondary]}
                >
                  <Text style={[styles.artDecoButtonText, styles.artDecoButtonTextSecondary]}>WANT TO VISIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Information Section - Cream Background */}
          <View style={styles.infoSection}>
            {/* Title with Art Deco styling */}
            <Text style={styles.title}>{currentPainting.title}</Text>

            <View style={styles.artistRow}>
              <Text style={styles.artistLabel}>by</Text>
              <TouchableOpacity onPress={navigateToArtist}>
                <Text style={styles.artist}>{currentPainting.artist}</Text>
              </TouchableOpacity>
            </View>

            {currentPainting.year ? <Text style={styles.year}>· {currentPainting.year} ·</Text> : null}

            {/* Status Tags */}
            {inCollection ? <View style={styles.tags}>
                {currentPainting.isSeen ? <View style={styles.tag}>
                    <Text style={styles.tagText}>SEEN</Text>
                  </View> : null}
                {currentPainting.wantToVisit ? <View style={[styles.tag, styles.tagWant]}>
                    <Text style={styles.tagText}>WANT TO VISIT</Text>
                  </View> : null}
                {isInPalette ? <View style={[styles.tag, styles.tagPalette]}>
                    <Text style={styles.tagText}>IN PALETTE</Text>
                  </View> : null}
              </View> : null}
          </View>

          {/* Description */}
          {currentPainting.description ? <View style={styles.section}>
              <Text style={styles.description}>{currentPainting.description}</Text>
            </View> : null}

          {/* Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionTitle}>DETAILS</Text>
              <View style={styles.dividerLine} />
            </View>

            {currentPainting.medium ? <View style={styles.detailRow}>
                <Text style={styles.label}>Medium</Text>
                <Text style={styles.value}>{currentPainting.medium}</Text>
              </View> : null}
            {currentPainting.dimensions ? <View style={styles.detailRow}>
                <Text style={styles.label}>Dimensions</Text>
                <Text style={styles.value}>{currentPainting.dimensions}</Text>
              </View> : null}
            {currentPainting.year ? <View style={styles.detailRow}>
                <Text style={styles.label}>Year</Text>
                <Text style={styles.value}>{currentPainting.year}</Text>
              </View> : null}
          </View>

          {/* Location Section */}
          {currentPainting.museum ? <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.dividerLine} />
                <Text style={styles.sectionTitle}>LOCATION</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.museum}>{currentPainting.museum}</Text>
              {currentPainting.location ? <Text style={styles.location}>{currentPainting.location}</Text> : null}
            </View> : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  actionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  actionTextActive: {
    color: '#1a1a1a',
  },
  artDecoButton: {
    alignItems: 'center',
    backgroundColor: '#004d40',
    borderColor: '#d4af37',
    borderRadius: 2,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 16,
  },
  artDecoButtonSecondary: {
    backgroundColor: 'transparent',
  },
  artDecoButtonText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  artDecoButtonTextSecondary: {
    color: '#004d40',
  },
  artist: {
    color: '#004d40',
    fontSize: 16,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  artistLabel: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  artistRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backText: {
    color: '#d4af37',
    fontSize: 28,
    fontWeight: '300',
  },
  container: {
    backgroundColor: '#f5f3ed', // Cream
    flex: 1,
  },
  cornerBottomLeft: {
    bottom: 20,
    left: 20,
    position: 'absolute',
    zIndex: 10,
  },
  cornerBottomRight: {
    bottom: 20,
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  cornerOrnament: {
    color: '#d4af37',
    fontSize: 16,
    opacity: 0.6,
  },
  cornerTopLeft: {
    left: 20,
    position: 'absolute',
    top: 20,
    zIndex: 10,
  },
  cornerTopRight: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 10,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  deleteText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
    marginTop: -4,
    textAlign: 'center',
  },
  description: {
    color: '#4a4a4a',
    fontSize: 15,
    lineHeight: 24,
  },
  detailRow: {
    marginBottom: 12,
  },
  dividerLine: {
    backgroundColor: '#d4af37',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#004d40',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  dividerVertical: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    height: 24,
    marginHorizontal: 4,
    width: 1,
  },
  errorContainer: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 8,
  },
  gallerySection: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 40,
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#d4af37', // Gold
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  image: {
    aspectRatio: 1,
    width: '100%',
  },
  infoSection: {
    backgroundColor: '#f5f3ed',
    borderBottomColor: '#d4af37',
    borderBottomWidth: 1,
    padding: 24,
  },
  label: {
    color: '#999',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    color: '#d4af37',
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 16,
  },
  location: {
    color: '#666',
    fontSize: 14,
  },
  museum: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderImage: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    letterSpacing: 1,
  },
  quickAddDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddSection: {
    backgroundColor: '#f5f3ed',
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#f5f3ed',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    padding: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#004d40',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  tag: {
    backgroundColor: '#e8f5e9',
    borderColor: '#004d40',
    borderRadius: 2,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagPalette: {
    backgroundColor: '#fffbeb',
    borderColor: '#d4af37',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  tagText: {
    color: '#2c2c2c',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  tagWant: {
    backgroundColor: '#fff3e0',
    borderColor: '#cd7f32',
  },
  title: {
    color: '#2c2c2c',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    marginBottom: 12,
    textAlign: 'center',
  },
  value: {
    color: '#2c2c2c',
    fontSize: 15,
  },
  year: {
    color: '#999',
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
});