import type { Painting } from '@/types/painting';
import type { MMKV } from 'react-native-mmkv';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { mockPaintings } from '@/data/mockPaintings';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { useCollection } from '@/contexts/CollectionContext';

const STORAGE_KEYS = {
  PALETTE_IDS: 'palette_painting_ids',
};

type PaletteContextType = {
  palettePaintingIds: string[];
  addToPalette: (paintingId: string) => boolean;
  removeFromPalette: (paintingId: string) => void;
  isPaintingInPalette: (paintingId: string) => boolean;
  getPalettePaintings: () => Painting[];
  /** Internal: allows sync to refresh palette from storage */
  _refreshFromStorage: () => void;
};

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

type PaletteProviderProps = {
  readonly children: React.ReactNode;
  readonly storage: MMKV;
};

export function PaletteProvider({ children, storage }: PaletteProviderProps) {
  const { user } = useAuth();
  const { syncService, reportSyncError } = useSync();
  const { paintings } = useCollection();
  const [palettePaintingIds, setPalettePaintingIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
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
      console.error('Error loading palette from storage:', error);
      setIsLoaded(true);
    }
  }, []);

  // Persist palette on change
  useEffect(() => {
    if (isLoaded) {
      try {
        storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(palettePaintingIds));
      } catch (error) {
        console.error('Error saving palette to storage:', error);
      }
    }
  }, [palettePaintingIds, isLoaded]);

  const _refreshFromStorage = useCallback(() => {
    const syncedPaletteIds = storage.getString(STORAGE_KEYS.PALETTE_IDS);
    if (syncedPaletteIds) {
      const parsed = JSON.parse(syncedPaletteIds);
      setPalettePaintingIds((prev: any) => {
        const prevJson = JSON.stringify(prev);
        const newJson = JSON.stringify(parsed);
        return prevJson === newJson ? prev : parsed;
      });
    }
  }, [storage]);

  const addToPalette = useCallback((paintingId: string): boolean => {
    if (palettePaintingIds.includes(paintingId)) return true;
    if (palettePaintingIds.length >= 8) return false;

    const newIds = [...palettePaintingIds, paintingId];
    setPalettePaintingIds(newIds);

    if (user?.id) {
      syncService.upsertPalette(user.id, newIds).catch(err => {
        reportSyncError(err?.message || 'Failed to sync palette');
      });
    }

    return true;
  }, [palettePaintingIds, user, syncService, reportSyncError]);

  const removeFromPalette = useCallback((paintingId: string) => {
    const newIds = palettePaintingIds.filter(id => id !== paintingId);
    setPalettePaintingIds(newIds);

    if (user?.id) {
      syncService.upsertPalette(user.id, newIds).catch(err => {
        reportSyncError(err?.message || 'Failed to sync palette');
      });
    }
  }, [palettePaintingIds, user, syncService, reportSyncError]);

  const isPaintingInPalette = useCallback((paintingId: string): boolean => {
    return palettePaintingIds.includes(paintingId);
  }, [palettePaintingIds]);

  const getPalettePaintings = useCallback((): Painting[] => {
    return palettePaintingIds
      .map(id => paintings.find(p => p.id === id))
      .filter((p): p is Painting => p !== undefined);
  }, [palettePaintingIds, paintings]);

  const value = useMemo(() => ({
    palettePaintingIds,
    addToPalette,
    removeFromPalette,
    isPaintingInPalette,
    getPalettePaintings,
    _refreshFromStorage,
  }), [palettePaintingIds, addToPalette, removeFromPalette, isPaintingInPalette, getPalettePaintings, _refreshFromStorage]);

  return (
    <PaletteContext.Provider value={value}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used within PaletteProvider');
  }
  return context;
}
