import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { MMKV } from 'react-native-mmkv';

import type { Painting } from '@/types/painting';
import { mockPaintings } from '@/data/mockPaintings';

type PaintingsContextType = {
  paintings: Painting[];
  palettePaintingIds: number[];

  // Collection management
  addToCollection: (painting: Painting) => void;
  removeFromCollection: (paintingId: number) => void;
  isInCollection: (paintingId: number) => boolean;

  // Metadata actions
  toggleSeen: (paintingId: number) => void;
  toggleWantToVisit: (paintingId: number) => void;

  // Palette management
  addToPalette: (paintingId: number) => boolean;
  removeFromPalette: (paintingId: number) => void;
  isPaintingInPalette: (paintingId: number) => boolean;

  // Queries
  getPalettePaintings: () => Painting[];
  getPaintingsByArtist: () => Map<string, Painting[]>;
  getPaintingsByMuseum: () => Map<string, Painting[]>;
};

const PaintingsContext = createContext<PaintingsContextType | undefined>(
  undefined,
);

const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
  PALETTE_IDS: 'palette_painting_ids',
};

type PaintingsProviderProps = {
  children: React.ReactNode;
  storage: MMKV;
};

export function PaintingsProvider({
  children,
  storage,
}: PaintingsProviderProps) {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [palettePaintingIds, setPalettePaintingIds] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Save to storage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage();
    }
  }, [paintings, palettePaintingIds, isLoaded, saveToStorage]);

  const loadFromStorage = useCallback(() => {
    try {
      // Load paintings
      const savedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
      if (savedPaintings) {
        setPaintings(JSON.parse(savedPaintings));
      } else {
        const initialPaintings = mockPaintings.map(p => ({
          ...p,
          dateAdded: new Date().toISOString(),
          wantToVisit: false,
        }));
        setPaintings(initialPaintings);
      }

      // Load palette IDs
      const savedPaletteIds = storage.getString(STORAGE_KEYS.PALETTE_IDS);
      if (savedPaletteIds) {
        setPalettePaintingIds(JSON.parse(savedPaletteIds));
      } else {
        const initialPalette = mockPaintings
          .filter(p => p.isSeen)
          .slice(0, 5)
          .map(p => p.id);
        setPalettePaintingIds(initialPalette);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading from storage:', error);
      setPaintings(mockPaintings);
      setIsLoaded(true);
    }
  }, [storage]);

  const saveToStorage = useCallback(() => {
    try {
      storage.set(
        STORAGE_KEYS.PAINTINGS,
        JSON.stringify(paintings),
      );
      storage.set(
        STORAGE_KEYS.PALETTE_IDS,
        JSON.stringify(palettePaintingIds),
      );
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [paintings, palettePaintingIds, storage]);

  const addToCollection = useCallback((painting: Painting) => {
    setPaintings(prev => {
      const exists = prev.some(
        p =>
          p.id === painting.id ||
          (p.title.toLowerCase() === painting.title.toLowerCase() &&
            p.artist.toLowerCase() === painting.artist.toLowerCase()),
      );

      if (exists) {
        return prev;
      }

      return [
        ...prev,
        {
          ...painting,
          dateAdded: new Date().toISOString(),
          isSeen: false,
          wantToVisit: false,
        },
      ];
    });
  }, []);

  const removeFromCollection = useCallback((paintingId: number) => {
    setPaintings(prev => prev.filter(p => p.id !== paintingId));
    setPalettePaintingIds(prev => prev.filter(id => id !== paintingId));
  }, []);

  const isInCollection = useCallback(
    (paintingId: number) => paintings.some(p => p.id === paintingId),
    [paintings],
  );

  const toggleSeen = useCallback((paintingId: number) => {
    setPaintings(prev =>
      prev.map(p =>
        p.id === paintingId
          ? {
              ...p,
              isSeen: !p.isSeen,
              seenDate: !p.isSeen
                ? new Date().toISOString()
                : undefined,
            }
          : p,
      ),
    );
  }, []);

  const toggleWantToVisit = useCallback((paintingId: number) => {
    setPaintings(prev =>
      prev.map(p =>
        p.id === paintingId
          ? { ...p, wantToVisit: !p.wantToVisit }
          : p,
      ),
    );
  }, []);

  const addToPalette = useCallback(
    (paintingId: number): boolean => {
      if (palettePaintingIds.includes(paintingId)) {
        return true;
      }

      if (palettePaintingIds.length >= 8) {
        return false;
      }

      setPalettePaintingIds(prev => [...prev, paintingId]);
      return true;
    },
    [palettePaintingIds],
  );

  const removeFromPalette = useCallback((paintingId: number) => {
    setPalettePaintingIds(prev =>
      prev.filter(id => id !== paintingId),
    );
  }, []);

  const isPaintingInPalette = useCallback(
    (paintingId: number) => palettePaintingIds.includes(paintingId),
    [palettePaintingIds],
  );

  const getPalettePaintings = useCallback((): Painting[] => {
    return palettePaintingIds
      .map(id => paintings.find(p => p.id === id))
      .filter((p): p is Painting => p !== undefined);
  }, [palettePaintingIds, paintings]);

  const getPaintingsByArtist = useCallback(() => {
    const grouped = new Map<string, Painting[]>();

    paintings.forEach(p => {
      if (!grouped.has(p.artist)) {
        grouped.set(p.artist, []);
      }
      grouped.get(p.artist)!.push(p);
    });

    return new Map(
      [...grouped.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    );
  }, [paintings]);

  const getPaintingsByMuseum = useCallback(() => {
    const grouped = new Map<string, Painting[]>();

    paintings.forEach(p => {
      const museum = p.museum || 'Unknown Museum';
      if (!grouped.has(museum)) {
        grouped.set(museum, []);
      }
      grouped.get(museum)!.push(p);
    });

    return new Map(
      [...grouped.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    );
  }, [paintings]);

  return (
    <PaintingsContext.Provider
      value={{
        paintings,
        palettePaintingIds,
        addToCollection,
        removeFromCollection,
        isInCollection,
        toggleSeen,
        toggleWantToVisit,
        addToPalette,
        removeFromPalette,
        isPaintingInPalette,
        getPalettePaintings,
        getPaintingsByArtist,
        getPaintingsByMuseum,
      }}
    >
      {children}
    </PaintingsContext.Provider>
  );
}

export function usePaintings() {
  const context = useContext(PaintingsContext);
  if (!context) {
    throw new Error(
      'usePaintings must be used within PaintingsProvider',
    );
  }
  return context;
}
