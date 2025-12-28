import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Painting } from '@/types/painting';
import { mockPaintings } from '@/data/mockPaintings';

type PaintingsContextType = {
  paintings: Painting[];
  palettePaintingIds: number[];
  toggleSeen: (paintingId: number) => void;
  addToPalette: (paintingId: number) => boolean;
  removeFromPalette: (paintingId: number) => void;
  isPaintingInPalette: (paintingId: number) => boolean;
  addPaintingToCollection: (painting: Painting) => void;
  getPalettePaintings: () => Painting[];
};

const PaintingsContext = createContext<PaintingsContextType | undefined>(undefined);

export function PaintingsProvider({ children }: { children: React.ReactNode }) {
  // Start with mock paintings
  const [paintings, setPaintings] = useState<Painting[]>(mockPaintings);

  // Palette holds IDs of user's top 8 paintings
  const [palettePaintingIds, setPalettePaintingIds] = useState<number[]>([]);

  // Initialize palette with first 5 mock paintings that are "seen"
  useEffect(() => {
    const initialPalette = mockPaintings
      .filter(p => p.isSeen)
      .slice(0, 5)
      .map(p => p.id);
    setPalettePaintingIds(initialPalette);
  }, []);

  // Toggle painting as seen/unseen
  const toggleSeen = useCallback((paintingId: number) => {
    setPaintings(prev =>
      prev.map(painting =>
        painting.id === paintingId
          ? { ...painting, isSeen: !painting.isSeen }
          : painting
      )
    );
  }, []);

  // Add painting to palette (max 8)
  const addToPalette = useCallback((paintingId: number): boolean => {
    if (palettePaintingIds.includes(paintingId)) {
      return true; // Already in palette
    }

    if (palettePaintingIds.length >= 8) {
      return false; // Palette full
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

  // Add a new painting to collection (from Met API search)
  const addPaintingToCollection = useCallback((painting: Painting) => {
    setPaintings(prev => {
      // Check if painting already exists (by ID or title+artist combo)
      const exists = prev.some(
        p => p.id === painting.id ||
        (p.title.toLowerCase() === painting.title.toLowerCase() &&
         p.artist.toLowerCase() === painting.artist.toLowerCase())
      );

      if (exists) {
        return prev; // Don't add duplicates
      }

      // Add to collection
      return [...prev, painting];
    });
  }, []);

  // Get palette paintings in order
  const getPalettePaintings = useCallback((): Painting[] => {
    return palettePaintingIds
      .map(id => paintings.find(p => p.id === id))
      .filter((p): p is Painting => p !== undefined);
  }, [palettePaintingIds, paintings]);

  return (
    <PaintingsContext.Provider
      value={{
        paintings,
        palettePaintingIds,
        toggleSeen,
        addToPalette,
        removeFromPalette,
        isPaintingInPalette,
        addPaintingToCollection,
        getPalettePaintings,
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