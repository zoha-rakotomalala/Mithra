import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image'; // Added this import
import { searchMetMuseum, searchMetByArtist, getPopularMetArtists } from '@/services/metMuseumService';
import { usePaintings } from '@/contexts/PaintingsContext';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

// Memoized grid item component for performance
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
            <Text style={styles.statusBadgeHeart}>♥</Text>
          )}
          {collectionStatus.wantToVisit && (
            <Text style={styles.statusBadgeDiamond}>◆</Text>
          )}
        </View>
      )}

      <View style={styles.museumBadge}>
        <Text style={styles.museumBadgeText}>MET</Text>
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Painting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await searchMetMuseum({
        query: searchQuery,
        hasImages: true,
      });

      setSearchResults(result.paintings);

      if (result.paintings.length === 0) {
        Alert.alert(
          'No Results',
          `No paintings found for "${searchQuery}".\n\nTry searching for:\n• An artist name (Van Gogh, Monet, Rembrandt)\n• A painting title (Starry Night, Water Lilies)\n• An art movement (Impressionism, Renaissance)`,
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
      const result = await searchMetByArtist(artistName);
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

  // Render item for FlatList (3 columns)
  const renderItem = useCallback(({ item, index }: { item: Painting; index: number }) => {
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

  // Key extractor
  const keyExtractor = useCallback((item: Painting) => `painting-${item.id}`, []);

  // Calculate item layout (fixed size optimization)
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: CARD_SIZE + 20, // height + marginBottom
    offset: (CARD_SIZE + 20) * Math.floor(index / 3),
    index,
  }), []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Art</Text>
          <View style={styles.brushStroke} />
          <Text style={styles.headerSubtitle}>The Metropolitan Museum</Text>
        </View>

        {/* Search Bar - Fixed at top */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
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
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
          >
            <Text style={styles.searchButtonText}>
              {isLoading ? 'Searching Met Museum...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results with FlatList */}
        <FlatList
          data={searchResults}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={7}
          // Separator
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          // Header
          ListHeaderComponent={() => (
            <>
              {/* Popular Artists - only when not searched */}
              {!hasSearched && (
                <View style={styles.popularSection}>
                  <Text style={styles.sectionTitle}>🏛️ FEATURED ARTISTS</Text>
                  <Text style={styles.sectionSubtitle}>
                    Explore works from The Met's collection
                  </Text>
                  <FlatList
                    horizontal
                    data={getPopularMetArtists()}
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

              {/* Info Banner */}
              {!hasSearched && (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerIcon}>🏛️</Text>
                  <View style={styles.infoBannerText}>
                    <Text style={styles.infoBannerTitle}>The Met Collection</Text>
                    <Text style={styles.infoBannerSubtitle}>
                      Search 470,000+ artworks from one of the world's greatest museums
                    </Text>
                  </View>
                </View>
              )}

              {/* Loading State */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2d6a4f" />
                  <Text style={styles.loadingText}>Searching The Met's collection...</Text>
                  <Text style={styles.loadingSubtext}>Finding paintings with images...</Text>
                </View>
              )}

              {/* Results Title */}
              {!isLoading && hasSearched && searchResults.length > 0 && (
                <Text style={styles.resultsTitle}>
                  {searchResults.length} {searchResults.length === 1 ? 'Painting' : 'Paintings'} Found
                </Text>
              )}
            </>
          )}
          // Empty state
          ListEmptyComponent={() => (
            !isLoading && !hasSearched ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🖼️</Text>
                <Text style={styles.emptyTitle}>Discover Masterpieces</Text>
                <Text style={styles.emptyText}>
                  Search The Metropolitan Museum's collection of European and American paintings, spanning from the Renaissance to Modern art.
                </Text>
                <View style={styles.exampleSearches}>
                  <Text style={styles.exampleTitle}>Popular searches:</Text>
                  <Text style={styles.exampleText}>
                    "Van Gogh", "Monet", "Rembrandt", "Renaissance", "Impressionism"
                  </Text>
                </View>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a4d3e',
    fontStyle: 'italic',
  },
  brushStroke: {
    marginTop: 4,
    width: 100,
    height: 2,
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
    opacity: 0.6,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#2d6a4f',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  popularSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  artistChips: {
    gap: 8,
    paddingRight: 20,
  },
  artistChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d6a4f',
    marginRight: 8,
  },
  artistChipText: {
    fontSize: 14,
    color: '#1a4d3e',
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#f0f7f4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
  },
  infoBannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 4,
  },
  infoBannerSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 16,
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
    borderRadius: 12,
    zIndex: 10,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  inCollectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inCollectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 4,
  },
  statusBadgeHeart: {
    fontSize: 18,
    color: '#e63946',
  },
  statusBadgeDiamond: {
    fontSize: 18,
    color: '#f59e0b',
  },
  museumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  museumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
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
    fontSize: 10,
    color: '#999',
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exampleSearches: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
  },
});