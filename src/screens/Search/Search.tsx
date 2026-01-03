import type { Painting } from '@/types/painting';

import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { Paths } from '@/navigation/paths';

import { MuseumSelector } from '@/components/MuseumSelector';

import { usePaintings } from '@/contexts/PaintingsContext';
import { searchStyles as styles } from './Search.styles';
import { getAllMuseums, TIER_1_MUSEUMS } from '@/services/museumRegistry';
import { getMuseumBadgeInfo, getPopularArtistsByMuseums, searchAllMuseums } from '@/services/unifiedMuseumService';

const { width } = Dimensions.get('window');

const GridItem = React.memo(({
  collectionStatus,
  inCollection,
  onPress,
  painting
}: {
  readonly collectionStatus?: { isSeen: boolean; wantToVisit: boolean };
  readonly inCollection: boolean;
  readonly onPress: () => void;
  readonly painting: Painting;
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const badgeInfo = getMuseumBadgeInfo(painting);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.resultCard}
    >
      <View style={styles.imageContainer}>
        {painting.imageUrl ? (
          <>
            {imageLoading ? <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator color="#d4af37" size="small" />
              </View> : null}
            <FastImage
              onLoadEnd={() => { setImageLoading(false); }}
              onLoadStart={() => { setImageLoading(true); }}
              resizeMode={FastImage.resizeMode.cover}
              source={{
                cache: FastImage.cacheControl.immutable,
                priority: FastImage.priority.normal,
                uri: painting.thumbnailUrl || painting.imageUrl,
              }}
              style={styles.resultImage}
            />
          </>
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: painting.color }]}>
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        {inCollection && collectionStatus ? <View style={styles.statusBadge}>
            {collectionStatus.isSeen ? <Text style={styles.badgeTextSeen}>S</Text> : null}
            {collectionStatus.wantToVisit ? <Text style={styles.badgeTextWant}>W</Text> : null}
          </View> : null}

        <View style={[styles.museumBadge, { backgroundColor: badgeInfo.color }]}>
          <Text style={styles.museumBadgeText}>{badgeInfo.shortName}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.resultTitle}>
        {painting.title}
      </Text>
      <Text numberOfLines={1} style={styles.resultArtist}>
        {painting.artist}
      </Text>
      {painting.year ? <Text style={styles.resultYear}>{painting.year}</Text> : null}
    </TouchableOpacity>
  );
});

export function Search() {
  const navigation = useNavigation();
  const { paintings: existingPaintings } = usePaintings();

  const allMuseums = getAllMuseums();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Painting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMuseums, setSelectedMuseums] = useState<string[]>(
    TIER_1_MUSEUMS // Default to best 4 museums
  );
  const [showMuseumPicker, setShowMuseumPicker] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (selectedMuseums.length === 0) {
      Alert.alert('Notice', 'Please select at least one museum to search');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await searchAllMuseums({
        maxResultsPerMuseum: 20,
        museumIds: selectedMuseums,
        query: searchQuery,
      });

      setSearchResults(result.paintings);

      if (result.paintings.length === 0) {
        Alert.alert(
          'No Results',
          `No paintings found for "${searchQuery}" in the selected museums.\n\nTry:\n• Different keywords\n• An artist name\n• A broader search term`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Search Error',
        'Failed to search paintings. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtistSearch = async (artistName: string) => {
    setSearchQuery(artistName);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await searchAllMuseums({
        maxResultsPerMuseum: 20,
        museumIds: selectedMuseums,
        query: artistName,
      });
      setSearchResults(result.paintings);
    } catch {
      Alert.alert('Search Error', 'Failed to search paintings by artist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaintingPress = useCallback((painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  }, [navigation]);

  const isAlreadyInCollection = useCallback((painting: Painting) => {
    const found = existingPaintings.find(
      p => p.id === painting.id ||
      (p.title.toLowerCase() === painting.title.toLowerCase() &&
       p.artist.toLowerCase() === painting.artist.toLowerCase())
    );
    return found ? {
      inCollection: true,
      status: { isSeen: found.isSeen || false, wantToVisit: found.wantToVisit || false }
    } : { inCollection: false };
  }, [existingPaintings]);

  const renderItem = useCallback(({ item }: { readonly item: Painting }) => {
    const collectionInfo = isAlreadyInCollection(item);
    return (
      <GridItem
        collectionStatus={collectionInfo.status}
        inCollection={collectionInfo.inCollection}
        onPress={() => { handlePaintingPress(item); }}
        painting={item}
      />
    );
  }, [handlePaintingPress, isAlreadyInCollection]);

  const keyExtractor = useCallback((item: Painting) => `painting-${item.id}`, []);

  const popularArtists = getPopularArtistsByMuseums(selectedMuseums);

  return (
    <>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SEARCH ART</Text>
          <View style={styles.headerDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerOrnament}>◆</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.headerSubtitle}>
            {selectedMuseums.length === allMuseums.length
              ? 'All Museums'
              : `${selectedMuseums.length} Museum${selectedMuseums.length === 1 ? '' : 's'} Selected`}
          </Text>
        </View>

        {/* Museum Selection Button */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            onPress={() => { setShowMuseumPicker(true); }}
            style={styles.selectMuseumsButton}
          >
            <View style={styles.selectMuseumsButtonContent}>
              <View>
                <Text style={styles.selectMuseumsLabel}>MUSEUMS</Text>
                <Text style={styles.selectMuseumsText}>
                  {selectedMuseums.length} of {allMuseums.length} selected
                </Text>
              </View>
              <Text style={styles.selectMuseumsIcon}>▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Artist or painting name..."
              placeholderTextColor="#999"
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            disabled={!searchQuery.trim() || isLoading}
            onPress={handleSearch}
            style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
          >
            <Text style={styles.searchButtonText}>
              {isLoading ? 'SEARCHING...' : 'SEARCH'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Museum Picker Modal */}
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          visible={showMuseumPicker}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Museums</Text>
              <TouchableOpacity
                onPress={() => { setShowMuseumPicker(false); }}
                style={styles.modalDoneButton}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <MuseumSelector
              onMuseumsChange={setSelectedMuseums}
              selectedMuseums={selectedMuseums}
            />
          </View>
        </Modal>

        {/* Results with FlatList */}
        <FlatList
          contentContainerStyle={styles.flatListContent}
          data={searchResults}
          initialNumToRender={15}
          keyExtractor={keyExtractor}
          ListEmptyComponent={() => (
            !isLoading && !hasSearched ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🖼️</Text>
                <Text style={styles.emptyTitle}>Begin Your Search</Text>
                <Text style={styles.emptyText}>
                  Explore paintings across {selectedMuseums.length} museum{selectedMuseums.length === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null
          )}
          ListHeaderComponent={() => (
            <>
              {!hasSearched && popularArtists.length > 0 && (
                <View style={styles.popularSection}>
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.sectionTitle}>FEATURED ARTISTS</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <FlatList
                    contentContainerStyle={styles.artistChips}
                    data={popularArtists}
                    horizontal
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleArtistSearch(item)}
                        style={styles.artistChip}
                      >
                        <Text style={styles.artistChipText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

              {!hasSearched && (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerTitle}>
                    {selectedMuseums.length === allMuseums.length
                      ? '2.5M+ artworks across all museums'
                      : `Search ${selectedMuseums.length} museum${selectedMuseums.length === 1 ? '' : 's'}`}
                  </Text>
                  <Text style={styles.infoBannerText}>
                    Explore masterpieces from world-renowned collections
                  </Text>
                </View>
              )}

              {isLoading ? <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#d4af37" size="large" />
                  <Text style={styles.loadingText}>Searching collections...</Text>
                </View> : null}

              {!isLoading && hasSearched && searchResults.length > 0 ? <View style={styles.resultsHeader}>
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.resultsTitle}>
                      {searchResults.length} {searchResults.length === 1 ? 'PAINTING' : 'PAINTINGS'}
                    </Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View> : null}
            </>
          )}
          maxToRenderPerBatch={15}
          numColumns={3}
          removeClippedSubviews
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          updateCellsBatchingPeriod={50}
          windowSize={7}
        />
      </View>
    </>
  );
}