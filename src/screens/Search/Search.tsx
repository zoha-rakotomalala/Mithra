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
import { searchPaintings as searchWikidata, searchByArtist as searchWikidataByArtist, getPopularArtists } from '@/services/wikidataService';
import { searchRijksmuseum, searchRijksmuseumByArtist, getPopularRijksmuseumArtists } from '@/services/rijksmuseumService';
import { usePaintings } from '@/contexts/PaintingsContext';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

type SearchSource = 'wikidata' | 'rijksmuseum' | 'both';

export function Search() {
  const navigation = useNavigation();
  const { paintings: existingPaintings } = usePaintings();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Painting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSource, setSearchSource] = useState<SearchSource>('both');
  const [resultsInfo, setResultsInfo] = useState({ wikidata: 0, rijksmuseum: 0 });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      let allResults: Painting[] = [];
      let wikidataCount = 0;
      let rijksCount = 0;

      // Search Rijksmuseum (always first, it's curated)
      if (searchSource === 'rijksmuseum' || searchSource === 'both') {
        try {
          const rijksResult = await searchRijksmuseum({
            query: searchQuery,
            limit: 20,
          });
          allResults = [...allResults, ...rijksResult.paintings];
          rijksCount = rijksResult.paintings.length;
          console.log(`✅ Rijksmuseum: ${rijksCount} results`);
        } catch (error) {
          console.error('Rijksmuseum search failed:', error);
        }
      }

      // Search Wikidata (if needed)
      if (searchSource === 'wikidata' || (searchSource === 'both' && allResults.length < 10)) {
        try {
          const wikidataResult = await searchWikidata({
            query: searchQuery,
            limit: searchSource === 'both' ? 15 : 30,
          });
          allResults = [...allResults, ...wikidataResult.paintings];
          wikidataCount = wikidataResult.paintings.length;
          console.log(`✅ Wikidata: ${wikidataCount} results`);
        } catch (error) {
          console.error('Wikidata search failed:', error);
        }
      }

      setSearchResults(allResults);
      setResultsInfo({ wikidata: wikidataCount, rijksmuseum: rijksCount });

      if (allResults.length === 0) {
        Alert.alert(
          'No Results',
          `No paintings found for "${searchQuery}".\n\nTry:\n• An artist name (Rembrandt, Van Gogh)\n• A famous painting (Night Watch, Starry Night)\n• A different search term`,
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

  const handleArtistSearch = async (artistName: string, source: SearchSource = 'both') => {
    setSearchQuery(artistName);
    setIsLoading(true);
    setHasSearched(true);

    try {
      let allResults: Painting[] = [];
      let rijksCount = 0;
      let wikidataCount = 0;

      // Rijksmuseum first
      if (source === 'rijksmuseum' || source === 'both') {
        try {
          const rijksResult = await searchRijksmuseumByArtist(artistName, 30);
          allResults = [...allResults, ...rijksResult.paintings];
          rijksCount = rijksResult.paintings.length;
        } catch (error) {
          console.error('Rijksmuseum artist search failed');
        }
      }

      // Wikidata if needed
      if (source === 'wikidata' || (source === 'both' && allResults.length < 20)) {
        try {
          const wikidataResult = await searchWikidataByArtist(artistName, 30);
          allResults = [...allResults, ...wikidataResult.paintings];
          wikidataCount = wikidataResult.paintings.length;
        } catch (error) {
          console.error('Wikidata artist search failed');
        }
      }

      setSearchResults(allResults);
      setResultsInfo({ wikidata: wikidataCount, rijksmuseum: rijksCount });
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

            {/* Source Selector */}
            <View style={styles.sourceSelector}>
              <TouchableOpacity
                style={[styles.sourceButton, searchSource === 'rijksmuseum' && styles.sourceButtonActive]}
                onPress={() => setSearchSource('rijksmuseum')}
              >
                <Text style={[styles.sourceButtonText, searchSource === 'rijksmuseum' && styles.sourceButtonTextActive]}>
                  🇳🇱 Rijksmuseum
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sourceButton, searchSource === 'both' && styles.sourceButtonActive]}
                onPress={() => setSearchSource('both')}
              >
                <Text style={[styles.sourceButtonText, searchSource === 'both' && styles.sourceButtonTextActive]}>
                  🌍 All Museums
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
            >
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Popular Artists */}
          {!hasSearched && (
            <>
              {/* Rijksmuseum Artists */}
              <View style={styles.popularSection}>
                <Text style={styles.sectionTitle}>🇳🇱 RIJKSMUSEUM MASTERS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.artistChips}
                >
                  {getPopularRijksmuseumArtists().map((artist) => (
                    <TouchableOpacity
                      key={artist}
                      style={styles.artistChip}
                      onPress={() => handleArtistSearch(artist, 'rijksmuseum')}
                    >
                      <Text style={styles.artistChipText}>{artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* All Museums Artists */}
              <View style={styles.popularSection}>
                <Text style={styles.sectionTitle}>🌍 FAMOUS ARTISTS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.artistChips}
                >
                  {getPopularArtists().slice(0, 10).map((artist) => (
                    <TouchableOpacity
                      key={artist}
                      style={[styles.artistChip, styles.artistChipSecondary]}
                      onPress={() => handleArtistSearch(artist, 'both')}
                    >
                      <Text style={styles.artistChipText}>{artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d6a4f" />
              <Text style={styles.loadingText}>
                Searching {searchSource === 'rijksmuseum' ? 'Rijksmuseum' :
                          searchSource === 'wikidata' ? 'Wikidata' :
                          'museums'}...
              </Text>
            </View>
          )}

          {/* Search Results */}
          {!isLoading && hasSearched && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {searchResults.length} Results
                </Text>
                {searchSource === 'both' && (resultsInfo.rijksmuseum > 0 || resultsInfo.wikidata > 0) && (
                  <Text style={styles.resultsSubtitle}>
                    🇳🇱 {resultsInfo.rijksmuseum} · 🌍 {resultsInfo.wikidata}
                  </Text>
                )}
              </View>

              <View style={styles.resultsGrid}>
                {searchResults.map((painting) => {
                  const inCollection = isAlreadyInCollection(painting);

                  return (
                    <TouchableOpacity
                      key={`${painting.id}-${painting.title}`}
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

                        {/* Museum badge */}
                        {painting.museum === 'Rijksmuseum' && (
                          <View style={styles.museumBadge}>
                            <Text style={styles.museumBadgeText}>🇳🇱</Text>
                          </View>
                        )}
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
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Search for Art</Text>
              <Text style={styles.emptyText}>
                Search the Rijksmuseum's curated collection or discover paintings from museums worldwide.
              </Text>
              <Text style={styles.emptyHint}>
                Try: "Rembrandt", "Night Watch", "Van Gogh"
              </Text>
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
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
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
  sourceSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sourceButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  sourceButtonActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
  },
  sourceButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  sourceButtonTextActive: {
    color: '#fff',
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
  },
  artistChipSecondary: {
    borderColor: '#E8E8E8',
  },
  artistChipText: {
    fontSize: 14,
    color: '#1a4d3e',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  resultsSection: {
    padding: 20,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
    fontSize: 16,
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
    paddingVertical: 80,
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
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});