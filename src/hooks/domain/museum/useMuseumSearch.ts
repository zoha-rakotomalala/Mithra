import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { usePaintings } from '@/contexts/PaintingsContext';
import { getAllMuseums, TIER_1_MUSEUMS } from '@/services/museumRegistry';
import {
  getPopularArtistsByMuseums,
  searchAllMuseums,
  type SearchType,
  type ProgressUpdate,
} from '@/services/unifiedMuseumService';
import type { Painting } from '@/types/painting';

export function useMuseumSearch() {
  const { paintings: existingPaintings } = usePaintings();
  const allMuseums = getAllMuseums();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('artist');
  const [searchResults, setSearchResults] = useState<Painting[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMuseums, setSelectedMuseums] = useState<string[]>(TIER_1_MUSEUMS);
  const [showMuseumPicker, setShowMuseumPicker] = useState(false);
  const [cacheStats, setCacheStats] = useState({ added: 0 });

  const handleProgressUpdate = useCallback((update: ProgressUpdate) => {
    if (update.phase === 'cache') {
      setIsLoadingCache(false);
    } else if (update.phase === 'api') {
      setIsRefreshing(true);
    } else if (update.phase === 'complete') {
      setIsRefreshing(false);
      if (update.added) {
        setCacheStats({ added: update.added });
        setTimeout(() => setCacheStats({ added: 0 }), 3000);
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (selectedMuseums.length === 0) {
      Alert.alert('Notice', 'Please select at least one museum to search');
      return;
    }

    setIsLoadingCache(true);
    setHasSearched(true);
    setCacheStats({ added: 0 });

    try {
      const result = await searchAllMuseums({
        query: searchQuery,
        searchType,
        museumIds: selectedMuseums,
        maxResultsPerMuseum: 20,
        useCache: true,
        onProgressUpdate: handleProgressUpdate,
      });

      setSearchResults(result.paintings);

      if (result.paintings.length === 0) {
        Alert.alert(
          'No Results',
          `No ${searchType === 'artist' ? 'works by' : 'paintings titled'} "${searchQuery}" found.\n\nTry different keywords or select more museums.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Search Error',
        'Failed to search paintings. Please check your connection.',
        [{ text: 'OK' }]
      );
      console.error('Search error:', error);
    } finally {
      setIsLoadingCache(false);
      setIsRefreshing(false);
    }
  };

  const handleArtistSearch = async (artistName: string) => {
    setSearchQuery(artistName);
    setSearchType('artist');
    setIsLoadingCache(true);
    setHasSearched(true);

    try {
      const result = await searchAllMuseums({
        query: artistName,
        searchType: 'artist',
        museumIds: selectedMuseums,
        maxResultsPerMuseum: 20,
        useCache: true,
        onProgressUpdate: handleProgressUpdate,
      });

      setSearchResults(result.paintings);
    } catch {
      Alert.alert('Search Error', 'Failed to search paintings by artist.');
    } finally {
      setIsLoadingCache(false);
      setIsRefreshing(false);
    }
  };

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

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const popularArtists = getPopularArtistsByMuseums(selectedMuseums);

  return {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    isLoadingCache,
    isRefreshing,
    hasSearched,
    selectedMuseums,
    setSelectedMuseums,
    showMuseumPicker,
    setShowMuseumPicker,
    cacheStats,
    allMuseums,
    popularArtists,
    handleSearch,
    handleArtistSearch,
    isAlreadyInCollection,
    clearSearch,
  };
}
