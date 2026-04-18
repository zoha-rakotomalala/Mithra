import { useState, useEffect } from 'react';
import {
  getLikedPaintingsForVisit,
  getCachedPaintings,
  getVisitById,
} from '@/services';
import type { Painting as CachedPainting } from '@/types/database';

interface UseLikedPaintingsOptions {
  museumName?: string;
  visitDate?: string;
}

export function useLikedPaintings(
  visitId: string,
  options?: UseLikedPaintingsOptions,
) {
  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [loading, setLoading] = useState(true);
  const [museumName, setMuseumName] = useState(options?.museumName ?? '');
  const [visitDate, setVisitDate] = useState(options?.visitDate ?? '');

  useEffect(() => {
    loadLikedPaintings();
  }, [visitId]);

  const loadLikedPaintings = async () => {
    setLoading(true);

    // If museum name or visit date weren't provided, fetch from visit data
    if (!options?.museumName || !options?.visitDate) {
      const visit = await getVisitById(visitId);
      if (visit) {
        if (!options?.museumName) {
          setMuseumName(visit.museum?.name ?? '');
        }
        if (!options?.visitDate) {
          setVisitDate(visit.visit_date ?? '');
        }
      }
    }

    const likes = await getLikedPaintingsForVisit(visitId);
    if (likes.length > 0) {
      const paintingIds = likes.map((l) => l.painting_id);
      const data = await getCachedPaintings(paintingIds);
      setPaintings(data);
    } else {
      setPaintings([]);
    }
    setLoading(false);
  };

  return { paintings, loading, count: paintings.length, museumName, visitDate };
}
