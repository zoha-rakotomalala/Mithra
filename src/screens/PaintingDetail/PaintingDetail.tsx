import type { Painting } from '@/types/painting';

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { Paths } from '@/navigation/paths';

import { BackButton } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { usePaintings } from '@/contexts/PaintingsContext';
import { paintingDetailStyles as styles } from './PaintingDetail.styles';

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
          <BackButton onPress={() => { navigation.goBack(); }} style={styles.backButton} textStyle={styles.backText} />

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
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
              <SectionHeader title="ADD TO COLLECTION" />

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
            <SectionHeader title="DETAILS" />

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
              <SectionHeader title="LOCATION" />

              <Text style={styles.museum}>{currentPainting.museum}</Text>
              {currentPainting.location ? <Text style={styles.location}>{currentPainting.location}</Text> : null}
            </View> : null}
        </ScrollView>
      </View>
    </>
  );
}