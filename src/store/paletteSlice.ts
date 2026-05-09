import type { StateCreator } from 'zustand';
import type { Painting } from '@/types/painting';
import type { AppStore, PaletteSlice } from './types';
import { storage, STORAGE_KEYS } from './storage';

const MAX_PALETTE_SIZE = 8;

export const createPaletteSlice: StateCreator<
  AppStore,
  [],
  [],
  PaletteSlice
> = (set, get) => ({
  palettePaintingIds: [],

  loadPaletteFromStorage: () => {
    try {
      const saved = storage.getString(STORAGE_KEYS.PALETTE_IDS);
      if (saved) {
        set({ palettePaintingIds: JSON.parse(saved) });
      } else {
        set({ palettePaintingIds: [] });
      }
    } catch {
      set({ palettePaintingIds: [] });
    }
  },

  addToPalette: (paintingId: string): boolean => {
    const { palettePaintingIds } = get();
    if (palettePaintingIds.includes(paintingId)) return true;
    if (palettePaintingIds.length >= MAX_PALETTE_SIZE) return false;

    const newIds = [...palettePaintingIds, paintingId];
    set({ palettePaintingIds: newIds });
    storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(newIds));
    return true;
  },

  removeFromPalette: (paintingId: string) => {
    const { palettePaintingIds } = get();
    const newIds = palettePaintingIds.filter((id) => id !== paintingId);
    set({ palettePaintingIds: newIds });
    storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(newIds));
  },

  isPaintingInPalette: (paintingId: string): boolean => {
    return get().palettePaintingIds.includes(paintingId);
  },

  getPalettePaintings: (): Painting[] => {
    const { palettePaintingIds, paintings } = get();
    return palettePaintingIds
      .map((id) => paintings.find((p) => p.id === id))
      .filter((p): p is Painting => p !== undefined);
  },

  setPalettePaintingIds: (ids: string[]) => {
    set({ palettePaintingIds: ids });
    storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(ids));
  },
});
