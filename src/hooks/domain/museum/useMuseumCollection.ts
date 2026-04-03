import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { searchAllMuseums } from '@/services/unifiedMuseumService';
import { likePainting, unlikePainting, getLikedUuidsForVisit } from '@/services';
import { usePaintings } from '@/contexts/PaintingsContext';
import type { Painting } from '@/types/painting';

export function useMuseumCollection(museumId: string, visitId: string) {
  const { addToCollection, isInCollection, toggleSeen } = usePaintings();
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLikedPaintings();
  }, [museumId, visitId]);

  const loadLikedPaintings = async () => {
    const liked = await getLikedUuidsForVisit(visitId);
    setLikedIds(liked);
  };

  const searchCollection = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const result = await searchAllMuseums({
        query: searchQuery.trim(),
        searchType: 'title',
        museumIds: [museumId],
        maxResultsPerMuseum: 50,
        qualityFilters: {
          requireImage: true,
          requireArtist: true,
          paintingsOnly: true,
          minRelevanceScore: 10,
        }
      });

      setPaintings(result.paintings);

      if (result.paintings.length === 0) {
        Alert.alert('No results found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching collection:', error);
      Alert.alert('Failed to search. Please try again.');
    }
    setLoading(false);
  };

  const handleLike = async (painting: Painting) => {
    const isCurrentlyLiked = likedIds.has(painting.id);

    if (isCurrentlyLiked) {
      await unlikePainting(painting.id, visitId);
      setLikedIds(prev => {
        const next = new Set(prev);
        next.delete(painting.id);
        return next;
      });
    } else {
      await likePainting(painting.id, visitId);
      setLikedIds(prev => new Set(prev).add(painting.id));
      // Bridge to PaintingsContext: add to collection as seen
      if (!isInCollection(painting.id)) {
        addToCollection({ ...painting, isSeen: true, wantToVisit: false });
      } else {
        toggleSeen(painting.id);
      }
    }
  };

  const isLiked = (painting: Painting) => {
    return likedIds.has(painting.id);
  };

  const getPaintingId = (painting: Painting) => {
    return painting.id;
  };

  return {
    paintings,
    loading,
    searchQuery,
    setSearchQuery,
    searchCollection,
    handleLike,
    isLiked,
    getPaintingId,
  };
}
