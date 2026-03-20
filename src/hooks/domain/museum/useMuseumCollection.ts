import { useState, useEffect } from 'react';
import { searchAllMuseums } from '@/services/unifiedMuseumService';
import { likePainting, unlikePainting, getLikedLegacyIdsForVisit } from '@/services';
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
    const liked = await getLikedLegacyIdsForVisit(visitId);
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
    const paintingId = `${museumId.toLowerCase()}-${painting.id}`;
    const isLiked = likedIds.has(paintingId);

    if (isLiked) {
      await unlikePainting(paintingId, visitId);
      setLikedIds(prev => {
        const next = new Set(prev);
        next.delete(paintingId);
        return next;
      });
    } else {
      await likePainting(paintingId, visitId);
      setLikedIds(prev => new Set(prev).add(paintingId));
    }
  };

  const isLiked = (painting: Painting) => {
    const paintingId = `${museumId.toLowerCase()}-${painting.id}`;
    return likedIds.has(paintingId);
  };

  const getPaintingId = (painting: Painting) => {
    return `${museumId.toLowerCase()}-${painting.id}`;
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
