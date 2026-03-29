import { useState, useEffect } from 'react';
import { searchAllMuseums } from '@/services/unifiedMuseumService';
import { likePainting, unlikePainting, getLikedUuidsForVisit } from '@/services';
import type { Painting } from '@/types/painting';

export function useMuseumCollection(museumId: string, visitId: string) {
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
      alert('Please enter a search term');
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
        alert('No results found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching collection:', error);
      alert('Failed to search. Please try again.');
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
