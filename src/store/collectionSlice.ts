import type { StateCreator } from 'zustand';
import type { Painting } from '@/types/painting';
import type { AppStore, CollectionSlice } from './types';
import { storage, STORAGE_KEYS } from './storage';

export const createCollectionSlice: StateCreator<
  AppStore,
  [],
  [],
  CollectionSlice
> = (set, get) => ({
  paintings: [],
  isLoaded: false,

  loadFromStorage: () => {
    try {
      const saved = storage.getString(STORAGE_KEYS.PAINTINGS);
      if (saved) {
        set({ paintings: JSON.parse(saved), isLoaded: true });
      } else {
        set({ paintings: [], isLoaded: true });
      }
    } catch {
      set({ paintings: [], isLoaded: true });
    }
  },

  addToCollection: (painting: Painting) => {
    const { paintings } = get();
    const exists = paintings.some(
      (p) =>
        p.id === painting.id ||
        (p.title.toLowerCase() === painting.title.toLowerCase() &&
          p.artist.toLowerCase() === painting.artist.toLowerCase()),
    );
    if (exists) return;

    const newPainting: Painting = {
      ...painting,
      dateAdded: painting.dateAdded || new Date().toISOString(),
      isSeen: painting.isSeen || false,
      wantToVisit: painting.wantToVisit === undefined ? true : painting.wantToVisit,
    };

    const updated = [...paintings, newPainting];
    set({ paintings: updated });
    storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(updated));
  },

  removeFromCollection: (paintingId: string) => {
    const { paintings, palettePaintingIds } = get();
    const updated = paintings.filter((p) => p.id !== paintingId);
    set({ paintings: updated });
    storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(updated));

    // Also remove from palette if present
    if (palettePaintingIds.includes(paintingId)) {
      const newPaletteIds = palettePaintingIds.filter((id) => id !== paintingId);
      set({ palettePaintingIds: newPaletteIds });
      storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(newPaletteIds));
    }
  },

  isInCollection: (paintingId: string) => {
    return get().paintings.some((p) => p.id === paintingId);
  },

  toggleSeen: (paintingId: string) => {
    const { paintings } = get();
    const updated = paintings.map((painting) =>
      painting.id === paintingId
        ? {
            ...painting,
            isSeen: !painting.isSeen,
            seenDate: painting.isSeen ? undefined : new Date().toISOString(),
            wantToVisit: false,
          }
        : painting,
    );
    set({ paintings: updated });
    storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(updated));
  },

  toggleWantToVisit: (paintingId: string) => {
    const { paintings } = get();
    const updated = paintings.map((painting) =>
      painting.id === paintingId
        ? {
            ...painting,
            isSeen: false,
            wantToVisit: !painting.wantToVisit,
          }
        : painting,
    );
    set({ paintings: updated });
    storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(updated));
  },

  getPaintingsByArtist: () => {
    const { paintings } = get();
    const grouped = new Map<string, Painting[]>();
    for (const painting of paintings) {
      const artist = painting.artist;
      if (!grouped.has(artist)) grouped.set(artist, []);
      grouped.get(artist)!.push(painting);
    }
    return new Map(
      [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    );
  },

  getPaintingsByMuseum: () => {
    const { paintings } = get();
    const grouped = new Map<string, Painting[]>();
    for (const painting of paintings) {
      const museum = painting.museum || 'Unknown Museum';
      if (!grouped.has(museum)) grouped.set(museum, []);
      grouped.get(museum)!.push(painting);
    }
    return new Map(
      [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    );
  },

  setPaintings: (paintings: Painting[]) => {
    set({ paintings });
    storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(paintings));
  },
});
