import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
  FlatList,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { searchAllMuseums, getPopularArtistsByMuseums, getMuseumBadgeInfo } from '@/services/unifiedMuseumService';
import { getAllMuseums, TIER_1_MUSEUMS } from '@/services/museumRegistry';
import { usePaintings } from '@/contexts/PaintingsContext';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { MuseumSelector } from '@/components/MuseumSelector';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

const GridItem = React.memo(({
  painting,
  onPress,
  inCollection,
  collectionStatus
}: {
  painting: Painting;
  onPress: () => void;
  inCollection: boolean;
  collectionStatus?: { isSeen: boolean; wantToVisit: boolean };
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const badgeInfo = getMuseumBadgeInfo(painting);

  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {painting.imageUrl ? (
          <>
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#d4af37" />
              </View>
            )}
            <FastImage
              source={{
                uri: painting.thumbnailUrl || painting.imageUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.resultImage}
              resizeMode={FastImage.resizeMode.cover}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </>
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: painting.color }]}>
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        {inCollection && collectionStatus && (
          <View style={styles.statusBadge}>
            {collectionStatus.isSeen && (
              <Text style={styles.badgeTextSeen}>S</Text>
            )}
            {collectionStatus.wantToVisit && (
              <Text style={styles.badgeTextWant}>W</Text>
            )}
          </View>
        )}

        <View style={[styles.museumBadge, { backgroundColor: badgeInfo.color }]}>
          <Text style={styles.museumBadgeText}>{badgeInfo.shortName}</Text>
        </View>
      </View>

      <Text style={styles.resultTitle} numberOfLines={2}>
        {painting.title}
      </Text>
      <Text style={styles.resultArtist} numberOfLines={1}>
        {painting.artist}
      </Text>
      {painting.year && (
        <Text style={styles.resultYear}>{painting.year}</Text>
      )}
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
        query: searchQuery,
        museumIds: selectedMuseums,
        maxResultsPerMuseum: 20,
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
        query: artistName,
        museumIds: selectedMuseums,
        maxResultsPerMuseum: 20,
      });
      setSearchResults(result.paintings);
    } catch (error) {
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

  const renderItem = useCallback(({ item }: { item: Painting }) => {
    const collectionInfo = isAlreadyInCollection(item);
    return (
      <GridItem
        painting={item}
        onPress={() => handlePaintingPress(item)}
        inCollection={collectionInfo.inCollection}
        collectionStatus={collectionInfo.status}
      />
    );
  }, [handlePaintingPress, isAlreadyInCollection]);

  const keyExtractor = useCallback((item: Painting) => `painting-${item.id}`, []);

  const popularArtists = getPopularArtistsByMuseums(selectedMuseums);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
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
              : `${selectedMuseums.length} Museum${selectedMuseums.length !== 1 ? 's' : ''} Selected`}
          </Text>
        </View>

        {/* Museum Selection Button */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.selectMuseumsButton}
            onPress={() => setShowMuseumPicker(true)}
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
              style={styles.searchInput}
              placeholder="Artist or painting name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
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
            style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
          >
            <Text style={styles.searchButtonText}>
              {isLoading ? 'SEARCHING...' : 'SEARCH'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Museum Picker Modal */}
        <Modal
          visible={showMuseumPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Museums</Text>
              <TouchableOpacity
                onPress={() => setShowMuseumPicker(false)}
                style={styles.modalDoneButton}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <MuseumSelector
              selectedMuseums={selectedMuseums}
              onMuseumsChange={setSelectedMuseums}
            />
          </View>
        </Modal>

        {/* Results with FlatList */}
        <FlatList
          data={searchResults}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={7}
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
                    horizontal
                    data={popularArtists}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.artistChip}
                        onPress={() => handleArtistSearch(item)}
                      >
                        <Text style={styles.artistChipText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.artistChips}
                  />
                </View>
              )}

              {!hasSearched && (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerTitle}>
                    {selectedMuseums.length === allMuseums.length
                      ? '2.5M+ artworks across all museums'
                      : `Search ${selectedMuseums.length} museum${selectedMuseums.length !== 1 ? 's' : ''}`}
                  </Text>
                  <Text style={styles.infoBannerText}>
                    Explore masterpieces from world-renowned collections
                  </Text>
                </View>
              )}

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#d4af37" />
                  <Text style={styles.loadingText}>Searching collections...</Text>
                </View>
              )}

              {!isLoading && hasSearched && searchResults.length > 0 && (
                <View style={styles.resultsHeader}>
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.resultsTitle}>
                      {searchResults.length} {searchResults.length === 1 ? 'PAINTING' : 'PAINTINGS'}
                    </Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              )}
            </>
          )}
          ListEmptyComponent={() => (
            !isLoading && !hasSearched ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🖼️</Text>
                <Text style={styles.emptyTitle}>Begin Your Search</Text>
                <Text style={styles.emptyText}>
                  Explore paintings across {selectedMuseums.length} museum{selectedMuseums.length !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ed',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#d4af37',
    marginBottom: 12,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.5,
  },
  dividerOrnament: {
    fontSize: 12,
    color: '#d4af37',
    marginHorizontal: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.7)',
    letterSpacing: 2,
  },
  filterSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  selectMuseumsButton: {
    backgroundColor: '#f5f3ed',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#004d40',
    overflow: 'hidden',
  },
  selectMuseumsButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  selectMuseumsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginBottom: 4,
  },
  selectMuseumsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  selectMuseumsIcon: {
    fontSize: 16,
    color: '#004d40',
    fontWeight: '700',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#f5f3ed',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 2,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#004d40',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#2c2c2c',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  searchButton: {
    backgroundColor: '#004d40',
    padding: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
    borderColor: '#999',
  },
  searchButtonText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f3ed',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4af37',
    letterSpacing: 2,
  },
  modalDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#004d40',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  modalDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  popularSection: {
    paddingVertical: 20,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  artistChips: {
    gap: 8,
    paddingRight: 20,
  },
  artistChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#004d40',
    marginRight: 8,
  },
  artistChipText: {
    fontSize: 11,
    color: '#004d40',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoBanner: {
    backgroundColor: 'rgba(0, 77, 64, 0.05)',
    padding: 20,
    borderRadius: 2,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#d4af37',
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#d4af37',
    letterSpacing: 1,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  resultCard: {
    width: CARD_SIZE,
    marginBottom: 20,
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    zIndex: 10,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 2,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badgeTextSeen: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  badgeTextWant: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  museumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  museumBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c2c2c',
    lineHeight: 16,
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  resultYear: {
    fontSize: 9,
    color: '#999',
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 12,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});