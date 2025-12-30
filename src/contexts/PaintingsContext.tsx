import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

const PaintingsContext = createContext<PaintingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
  PALETTE_IDS: 'palette_painting_ids',
};

type PaintingsProviderProps = {
  children: React.ReactNode;
  storage: MMKV;
};

export function PaintingsProvider({ children, storage }: PaintingsProviderProps) {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [palettePaintingIds, setPalettePaintingIds] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save to storage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage();
    }
  }, [paintings, palettePaintingIds, isLoaded]);

  const loadFromStorage = useCallback(() => {
    try {
      // Load paintings
      const savedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
      if (savedPaintings) {
        const parsed = JSON.parse(savedPaintings);
        setPaintings(parsed);
      } else {
        // First time: Initialize with mock paintings
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
        // Initialize with first 5 seen mock paintings
        const initialPalette = mockPaintings
          .filter(p => p.isSeen)
          .slice(0, 5)
          .map(p => p.id);
        setPalettePaintingIds(initialPalette);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading from storage:', error);
      // Fallback to mock data
      setPaintings(mockPaintings);
      setIsLoaded(true);
    }
  }, []);

  const saveToStorage = useCallback(() => {
    try {
      storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(paintings));
      storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(palettePaintingIds));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [paintings, palettePaintingIds]);

  // Add painting to collection (explicit action)
  // Can specify initial state
  const addToCollection = useCallback((painting: Painting) => {
    setPaintings(prev => {
      // Check if already exists
      const exists = prev.some(
        p => p.id === painting.id ||
        (p.title.toLowerCase() === painting.title.toLowerCase() &&
         p.artist.toLowerCase() === painting.artist.toLowerCase())
      );

      if (exists) {
        return prev;
      }

      // Add with metadata - preserve any state passed in, or default to Want to Visit
      const newPainting: Painting = {
        ...painting,
        dateAdded: painting.dateAdded || new Date().toISOString(),
        isSeen: painting.isSeen || false,
        wantToVisit: painting.wantToVisit !== undefined ? painting.wantToVisit : true,
      };

      return [...prev, newPainting];
    });
  }, []);

  // Remove painting from collection
  const removeFromCollection = useCallback((paintingId: number) => {
    setPaintings(prev => prev.filter(p => p.id !== paintingId));
    // Also remove from palette if present
    setPalettePaintingIds(prev => prev.filter(id => id !== paintingId));
  }, []);

  // Check if painting is in collection
  const isInCollection = useCallback((paintingId: number): boolean => {
    return paintings.some(p => p.id === paintingId);
  }, [paintings]);

  // Toggle painting as seen/unseen
  // Mutually exclusive with wantToVisit
  const toggleSeen = useCallback((paintingId: number) => {
    setPaintings(prev =>
      prev.map(painting =>
        painting.id === paintingId
          ? {
              ...painting,
              isSeen: !painting.isSeen,
              wantToVisit: painting.isSeen ? false : false, // If marking as seen, remove want to visit
              seenDate: !painting.isSeen ? new Date().toISOString() : undefined,
            }
          : painting
      )
    );
  }, []);

  // Toggle want to visit
  // Mutually exclusive with isSeen
  const toggleWantToVisit = useCallback((paintingId: number) => {
    setPaintings(prev =>
      prev.map(painting =>
        painting.id === paintingId
          ? {
              ...painting,
              wantToVisit: !painting.wantToVisit,
              isSeen: painting.wantToVisit ? false : false, // If marking as want to visit, remove seen
            }
          : painting
      )
    );
  }, []);

  // Add painting to palette (max 8)
  const addToPalette = useCallback((paintingId: number): boolean => {
    if (palettePaintingIds.includes(paintingId)) {
      return true;
    }

    if (palettePaintingIds.length >= 8) {
      return false;
    }

    setPalettePaintingIds(prev => [...prev, paintingId]);
    return true;
  }, [palettePaintingIds]);

  // Remove painting from palette
  const removeFromPalette = useCallback((paintingId: number) => {
    setPalettePaintingIds(prev => prev.filter(id => id !== paintingId));
  }, []);

  // Check if painting is in palette
  const isPaintingInPalette = useCallback((paintingId: number): boolean => {
    return palettePaintingIds.includes(paintingId);
  }, [palettePaintingIds]);

  // Get palette paintings
  const getPalettePaintings = useCallback((): Painting[] => {
    return palettePaintingIds
      .map(id => paintings.find(p => p.id === id))
      .filter((p): p is Painting => p !== undefined);
  }, [palettePaintingIds, paintings]);

  // Get paintings grouped by artist
  const getPaintingsByArtist = useCallback((): Map<string, Painting[]> => {
    const grouped = new Map<string, Painting[]>();

    paintings.forEach(painting => {
      const artist = painting.artist;
      if (!grouped.has(artist)) {
        grouped.set(artist, []);
      }
      grouped.get(artist)!.push(painting);
    });

    // Sort by artist name
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [paintings]);

  // Get paintings grouped by museum
  const getPaintingsByMuseum = useCallback((): Map<string, Painting[]> => {
    const grouped = new Map<string, Painting[]>();

    paintings.forEach(painting => {
      const museum = painting.museum || 'Unknown Museum';
      if (!grouped.has(museum)) {
        grouped.set(museum, []);
      }
      grouped.get(museum)!.push(painting);
    });

    // Sort by museum name
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
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
    throw new Error('usePaintings must be used within PaintingsProvider');
  }
  return context;
}