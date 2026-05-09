import { create } from 'zustand';
import type { AppStore } from './types';
import { createCollectionSlice } from './collectionSlice';
import { createPaletteSlice } from './paletteSlice';
import { createSyncSlice } from './syncSlice';

export const useAppStore = create<AppStore>()((...args) => ({
  ...createCollectionSlice(...args),
  ...createPaletteSlice(...args),
  ...createSyncSlice(...args),
}));

// Convenience selectors
export const useCollectionStore = () =>
  useAppStore((state) => ({
    paintings: state.paintings,
    isLoaded: state.isLoaded,
    addToCollection: state.addToCollection,
    removeFromCollection: state.removeFromCollection,
    isInCollection: state.isInCollection,
    toggleSeen: state.toggleSeen,
    toggleWantToVisit: state.toggleWantToVisit,
    getPaintingsByArtist: state.getPaintingsByArtist,
    getPaintingsByMuseum: state.getPaintingsByMuseum,
  }));

export const usePaletteStore = () =>
  useAppStore((state) => ({
    palettePaintingIds: state.palettePaintingIds,
    addToPalette: state.addToPalette,
    removeFromPalette: state.removeFromPalette,
    isPaintingInPalette: state.isPaintingInPalette,
    getPalettePaintings: state.getPalettePaintings,
  }));

export const useSyncStore = () =>
  useAppStore((state) => ({
    syncing: state.syncing,
    syncError: state.syncError,
    deadLetterQueue: state.deadLetterQueue,
    retryDeadLetterItem: state.retryDeadLetterItem,
    clearDeadLetter: state.clearDeadLetter,
  }));

export type { AppStore } from './types';
