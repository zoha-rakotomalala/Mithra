import { useState, useEffect } from 'react';
import { getLikedPaintingsForVisit, getCachedPaintings } from '@/services';
import type { Painting as CachedPainting } from '@/types/database';

export function useLikedPaintings(visitId: string) {
  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikedPaintings();
  }, [visitId]);

  const loadLikedPaintings = async () => {
    setLoading(true);
    const likes = await getLikedPaintingsForVisit(visitId);
    if (likes.length > 0) {
      const paintingIds = likes.map(l => l.painting_id);
      const data = await getCachedPaintings(paintingIds);
      setPaintings(data);
    } else {
      setPaintings([]);
    }
    setLoading(false);
  };

  return { paintings, loading, count: paintings.length };
}
