import type { Painting } from '@/types/painting';

export interface QueuedOperation {
  id: string;
  type: 'upsert_collection' | 'delete_collection' | 'upsert_palette';
  payload: any;
  createdAt: string;
  retryCount: number;
}

export interface DeadLetterItem {
  operation: QueuedOperation;
  failedAt: string;
  lastError: string;
}

export interface CollectionSlice {
  paintings: Painting[];
  isLoaded: boolean;

  loadFromStorage: () => void;
  addToCollection: (painting: Painting) => void;
  removeFromCollection: (paintingId: string) => void;
  isInCollection: (paintingId: string) => boolean;
  toggleSeen: (paintingId: string) => void;
  toggleWantToVisit: (paintingId: string) => void;
  getPaintingsByArtist: () => Map<string, Painting[]>;
  getPaintingsByMuseum: () => Map<string, Painting[]>;
  setPaintings: (paintings: Painting[]) => void;
}

export interface PaletteSlice {
  palettePaintingIds: string[];

  loadPaletteFromStorage: () => void;
  addToPalette: (paintingId: string) => boolean;
  removeFromPalette: (paintingId: string) => void;
  isPaintingInPalette: (paintingId: string) => boolean;
  getPalettePaintings: () => Painting[];
  setPalettePaintingIds: (ids: string[]) => void;
}

export interface SyncSlice {
  syncing: boolean;
  syncError: string | null;
  deadLetterQueue: DeadLetterItem[];

  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  addToDeadLetter: (item: DeadLetterItem) => void;
  removeFromDeadLetter: (operationId: string) => void;
  retryDeadLetterItem: (operationId: string) => void;
  clearDeadLetter: () => void;
}

export type AppStore = CollectionSlice & PaletteSlice & SyncSlice;
