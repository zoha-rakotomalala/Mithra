import { useCallback, useEffect, useState } from 'react';
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
import {
  getLikedUuidsForVisit,
  likePainting,
  unlikePainting,
} from '@/services/likes.service';

interface UseMuseumSearchOptions {
  initialMuseumId?: string;
  visitId?: string;
}

export function useMuseumSearch(options: UseMuseumSearchOptions = {}) {
  const { initialMuseumId, visitId } = options;
  const { paintings: existingPaintings, addToCollection, isInCollection, toggleSeen } = usePaintings();
  const allMuseums = getAllMuseums();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('artist');
  const [searchResults, setSearchResults] = useState<Painting[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMuseums, setSelectedMuseums] = useState<string[]>(
    initialMuseumId ? [initialMuseumId] : TIER_1_MUSEUMS
  );
  const [showMuseumPicker, setShowMuseumPicker] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Load liked painting UUIDs when visitId is provided
  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;
    getLikedUuidsForVisit(visitId).then((ids) => {
      if (!cancelled) setLikedIds(ids);
    });
    return () => { cancelled = true; };
  }, [visitId]);

  const handleLike = useCallback(async (painting: Painting) => {
    if (!visitId) return;
    const paintingId = painting.id;
    if (likedIds.has(paintingId)) {
      await unlikePainting(paintingId, visitId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(paintingId);
        return next;
      });
    } else {
      await likePainting(paintingId, visitId);
      setLikedIds((prev) => new Set(prev).add(paintingId));
      // Bridge to PaintingsContext: add to collection as seen
      if (!isInCollection(paintingId)) {
        addToCollection({ ...painting, isSeen: true, wantToVisit: false });
      } else {
        toggleSeen(paintingId);
      }
    }
  }, [visitId, likedIds, addToCollection, isInCollection, toggleSeen]);

  const isLiked = useCallback((painting: Painting) => {
    return likedIds.has(painting.id);
  }, [likedIds]);

  const handleProgressUpdate = useCallback((update: ProgressUpdate) => {
    if (update.phase === 'cache') {
      setIsLoadingCache(false);
    } else if (update.phase === 'api') {
      console.log('[Search] API refresh started');
    } else if (update.phase === 'complete') {
      if (update.added) {
        console.log(`[Search] Cache updated: +${update.added} new results`);
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
    hasSearched,
    selectedMuseums,
    setSelectedMuseums,
    showMuseumPicker,
    setShowMuseumPicker,
    allMuseums,
    popularArtists,
    handleSearch,
    handleArtistSearch,
    isAlreadyInCollection,
    clearSearch,
    visitId,
    handleLike,
    isLiked,
  };
}
