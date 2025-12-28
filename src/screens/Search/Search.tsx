import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchMetMuseum, searchMetByArtist, getPopularMetArtists } from '@/services/metMuseumService';
import { usePaintings } from '@/contexts/PaintingsContext';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

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

  const handlePaintingPress = (painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  };

  const isAlreadyInCollection = (painting: Painting): boolean => {
    return existingPaintings.some(
      p => p.title.toLowerCase() === painting.title.toLowerCase() &&
           p.artist.toLowerCase() === painting.artist.toLowerCase()
    );
  };

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar */}
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

          {/* Popular Artists */}
          {!hasSearched && (
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>🏛️ FEATURED ARTISTS</Text>
              <Text style={styles.sectionSubtitle}>
                Explore works from The Met's collection
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.artistChips}
              >
                {getPopularMetArtists().map((artist) => (
                  <TouchableOpacity
                    key={artist}
                    style={styles.artistChip}
                    onPress={() => handleArtistSearch(artist)}
                  >
                    <Text style={styles.artistChipText}>{artist}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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

          {/* Search Results */}
          {!isLoading && hasSearched && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                {searchResults.length} {searchResults.length === 1 ? 'Painting' : 'Paintings'} Found
              </Text>

              <View style={styles.resultsGrid}>
                {searchResults.map((painting) => {
                  const inCollection = isAlreadyInCollection(painting);

                  return (
                    <TouchableOpacity
                      key={painting.id}
                      style={styles.resultCard}
                      onPress={() => handlePaintingPress(painting)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.imageContainer}>
                        {painting.imageUrl ? (
                          <Image
                            source={{ uri: painting.imageUrl }}
                            style={styles.resultImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.placeholderImage, { backgroundColor: painting.color }]}>
                            <Text style={styles.placeholderIcon}>🎨</Text>
                          </View>
                        )}

                        {inCollection && (
                          <View style={styles.inCollectionBadge}>
                            <Text style={styles.inCollectionText}>✓</Text>
                          </View>
                        )}

                        {/* Met Museum badge */}
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
                })}
              </View>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && !hasSearched && (
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
          )}
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
  popularSection: {
    padding: 20,
    paddingBottom: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  artistChipText: {
    fontSize: 14,
    color: '#1a4d3e',
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#f0f7f4',
    marginHorizontal: 20,
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
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 16,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
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
    backgroundColor: '#2d6a4f',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  inCollectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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