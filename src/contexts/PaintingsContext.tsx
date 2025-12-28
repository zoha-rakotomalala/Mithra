import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/App';
import { mockPaintings as initialPaintings } from '@/data/mockPaintings';
import { LoadingScreen } from '@/components/templates/LoadingScreen/LoadingScreen';
import type { Painting } from '@/types/painting';

type PaintingsContextType = {
  paintings: Painting[];
  palettePaintingIds: number[]; // Max 8 IDs (excluding profile at position 3)
  toggleSeen: (paintingId: number) => void;
  addToPalette: (paintingId: number) => boolean; // Returns true if successful
  removeFromPalette: (paintingId: number) => void;
  isPaintingInPalette: (paintingId: number) => boolean;
  addPaintingToCollection: (painting: Painting) => boolean; // NEW: Add from search
  isPaintingInCollection: (painting: Painting) => boolean; // NEW: Check if exists
};

const PaintingsContext = createContext<PaintingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PAINTINGS: 'palette_paintings',
  PALETTE_IDS: 'palette_palette_ids',
  VERSION: 'palette_data_version',
};

const DATA_VERSION = '1.0'; // Increment when data structure changes

export function PaintingsProvider({ children }: { children: ReactNode }) {
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

  const loadFromStorage = () => {
    try {
      const storedVersion = storage.getString(STORAGE_KEYS.VERSION);

      // Check if we need to migrate or use fresh data
      if (storedVersion !== DATA_VERSION) {
        console.log('Data version mismatch or first load, using initial data');
        initializeWithDefaults();
        return;
      }

      const storedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
      const storedPaletteIds = storage.getString(STORAGE_KEYS.PALETTE_IDS);

      if (storedPaintings && storedPaletteIds) {
        setPaintings(JSON.parse(storedPaintings));
        setPalettePaintingIds(JSON.parse(storedPaletteIds));
        console.log('✅ Loaded data from storage');
      } else {
        initializeWithDefaults();
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      initializeWithDefaults();
    } finally {
      setIsLoaded(true);
    }
  };

  const saveToStorage = () => {
    try {
      storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(paintings));
      storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(palettePaintingIds));
      storage.set(STORAGE_KEYS.VERSION, DATA_VERSION);
      console.log('💾 Saved to storage');
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  };

  const initializeWithDefaults = () => {
    setPaintings(initialPaintings);
    // Initial palette: first 8 paintings
    setPalettePaintingIds(initialPaintings.slice(0, 8).map(p => p.id));
    console.log('🎨 Initialized with default data');
  };

  const toggleSeen = (paintingId: number) => {
    setPaintings(prev =>
      prev.map(p =>
        p.id === paintingId ? { ...p, isSeen: !p.isSeen } : p
      )
    );
  };

  const addToPalette = (paintingId: number): boolean => {
    // Max 8 paintings in palette
    if (palettePaintingIds.length >= 8) {
      return false;
    }

    if (!palettePaintingIds.includes(paintingId)) {
      setPalettePaintingIds(prev => [...prev, paintingId]);
      setPaintings(prev =>
        prev.map(p =>
          p.id === paintingId ? { ...p, isInPalette: true } : p
        )
      );
      return true;
    }
    return false;
  };

  const removeFromPalette = (paintingId: number) => {
    setPalettePaintingIds(prev => prev.filter(id => id !== paintingId));
    setPaintings(prev =>
      prev.map(p =>
        p.id === paintingId ? { ...p, isInPalette: false } : p
      )
    );
  };

  const isPaintingInPalette = (paintingId: number): boolean => {
    return palettePaintingIds.includes(paintingId);
  };

  const addPaintingToCollection = (painting: Painting): boolean => {
    // Check if already exists (by title and artist)
    const exists = paintings.some(
      p => p.title.toLowerCase() === painting.title.toLowerCase() &&
           p.artist.toLowerCase() === painting.artist.toLowerCase()
    );

    if (exists) {
      return false; // Already in collection
    }

    // Find the highest ID and add 1
    const maxId = paintings.reduce((max, p) => Math.max(max, p.id), 0);
    const newPainting = {
      ...painting,
      id: maxId + 1,
      isSeen: false,
      isInPalette: false,
    };

    setPaintings(prev => [...prev, newPainting]);
    return true;
  };

  const isPaintingInCollection = (painting: Painting): boolean => {
    return paintings.some(
      p => p.title.toLowerCase() === painting.title.toLowerCase() &&
           p.artist.toLowerCase() === painting.artist.toLowerCase()
    );
  };

  // Don't render children until data is loaded
  if (!isLoaded) {
    return <LoadingScreen />;
  }

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
        isPaintingInCollection,
      }}
    >
      {children}
    </PaintingsContext.Provider>
  );
}

export function usePaintings() {
  const context = useContext(PaintingsContext);
  if (context === undefined) {
    throw new Error('usePaintings must be used within a PaintingsProvider');
  }
  return context;
}