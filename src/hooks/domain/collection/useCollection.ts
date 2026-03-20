import { useCallback, useMemo, useState } from 'react';
import { usePaintings } from '@/contexts/PaintingsContext';
import type { Painting } from '@/types/painting';

type FilterType = 'all' | 'artist' | 'museum' | 'seen' | 'wantToVisit';
type SortType = 'alphabetical' | 'recentlyAdded' | 'yearNewest' | 'yearOldest';
type GroupedSection = {
  data: Painting[];
  title: string;
};

export function useCollection() {
  const { getPaintingsByArtist, getPaintingsByMuseum, paintings } = usePaintings();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recentlyAdded');

  const stats = useMemo(() => {
    const total = paintings.length;
    const seen = paintings.filter(p => p.isSeen).length;
    const wantToVisit = paintings.filter(p => p.wantToVisit).length;
    return { seen, total, wantToVisit };
  }, [paintings]);

  const preparedData = useMemo((): GroupedSection[] => {
    if (activeFilter === 'artist') {
      const grouped = getPaintingsByArtist();
      return [...grouped.entries()].map(([artist, paintingsData]) => ({
        data: paintingsData,
        title: artist,
      }));
    }

    if (activeFilter === 'museum') {
      const grouped = getPaintingsByMuseum();
      return [...grouped.entries()].map(([museum, paintingsData]) => ({
        data: paintingsData,
        title: museum,
      }));
    }

    let filtered = [...paintings];

    switch (activeFilter) {
      case 'seen': {
        filtered = filtered.filter(p => p.isSeen);
        break;
      }
      case 'wantToVisit': {
        filtered = filtered.filter(p => p.wantToVisit);
        break;
      }
    }

    switch (sortBy) {
      case 'alphabetical': {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      }
      case 'recentlyAdded': {
        filtered.sort((a, b) => {
          const dateA = new Date(a.dateAdded || 0).getTime();
          const dateB = new Date(b.dateAdded || 0).getTime();
          return dateB - dateA;
        });
        break;
      }
      case 'yearNewest': {
        filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      }
      case 'yearOldest': {
        filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      }
    }

    return [{ data: filtered, title: '' }];
  }, [paintings, activeFilter, sortBy, getPaintingsByArtist, getPaintingsByMuseum]);

  const isGroupedView = activeFilter === 'artist' || activeFilter === 'museum';

  return {
    paintings,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    stats,
    preparedData,
    isGroupedView,
  };
}
