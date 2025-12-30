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

  const navigateToArtist = () => {
    navigation.navigate(Paths.ArtistProfile, { artistName: currentPainting.artist });
  };

  const imageUrl = currentPainting.imageUrl;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {inCollection && (
            <View style={styles.headerActions}>
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
            </View>
          )}
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
                {imageLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d4af37" />
                    <Text style={styles.loadingText}>Loading artwork...</Text>
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
                    <Text style={styles.errorText}>Unable to load artwork</Text>
                    <Text style={styles.errorSubtext}>Image may be unavailable</Text>
                  </View>
                )}
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
                  style={styles.artDecoButton}
                  onPress={() => handleQuickAdd('seen')}
                >
                  <Text style={styles.artDecoButtonText}>SEEN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.artDecoButton, styles.artDecoButtonSecondary]}
                  onPress={() => handleQuickAdd('wantToVisit')}
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

            {currentPainting.year && (
              <Text style={styles.year}>· {currentPainting.year} ·</Text>
            )}

            {/* Status Tags */}
            {inCollection && (
              <View style={styles.tags}>
                {currentPainting.isSeen && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>SEEN</Text>
                  </View>
                )}
                {currentPainting.wantToVisit && (
                  <View style={[styles.tag, styles.tagWant]}>
                    <Text style={styles.tagText}>WANT TO VISIT</Text>
                  </View>
                )}
                {isInPalette && (
                  <View style={[styles.tag, styles.tagPalette]}>
                    <Text style={styles.tagText}>IN PALETTE</Text>
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

          {/* Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionTitle}>DETAILS</Text>
              <View style={styles.dividerLine} />
            </View>

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

          {/* Location Section */}
          {currentPainting.museum && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.dividerLine} />
                <Text style={styles.sectionTitle}>LOCATION</Text>
                <View style={styles.dividerLine} />
              </View>

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
    backgroundColor: '#f5f3ed', // Cream
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37', // Gold
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#d4af37',
    fontWeight: '300',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 14,
  },
  actionTextActive: {
    color: '#1a1a1a',
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginHorizontal: 4,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 28,
    textAlign: 'center',
    marginTop: -4,
  },
  gallerySection: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 10,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  cornerOrnament: {
    fontSize: 16,
    color: '#d4af37',
    opacity: 0.6,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  loadingContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#d4af37',
    letterSpacing: 1,
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },
  quickAddSection: {
    padding: 24,
    backgroundColor: '#f5f3ed',
  },
  quickAddDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  artDecoButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#004d40',
    borderWidth: 2,
    borderColor: '#d4af37',
    alignItems: 'center',
    borderRadius: 2,
  },
  artDecoButtonSecondary: {
    backgroundColor: 'transparent',
  },
  artDecoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 2,
  },
  artDecoButtonTextSecondary: {
    color: '#004d40',
  },
  infoSection: {
    padding: 24,
    backgroundColor: '#f5f3ed',
    borderBottomWidth: 1,
    borderBottomColor: '#d4af37',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 12,
    lineHeight: 36,
    textAlign: 'center',
  },
  artistRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  artistLabel: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  artist: {
    fontSize: 16,
    color: '#004d40',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  year: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#004d40',
    borderRadius: 2,
  },
  tagWant: {
    backgroundColor: '#fff3e0',
    borderColor: '#cd7f32',
  },
  tagPalette: {
    backgroundColor: '#fffbeb',
    borderColor: '#d4af37',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2c2c2c',
    letterSpacing: 1.5,
  },
  section: {
    padding: 24,
    backgroundColor: '#f5f3ed',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  description: {
    fontSize: 15,
    color: '#4a4a4a',
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
    letterSpacing: 1,
  },
  value: {
    fontSize: 15,
    color: '#2c2c2c',
  },
  museum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
});