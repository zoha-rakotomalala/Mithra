import type { MMKV } from 'react-native-mmkv';

export const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
  PALETTE_IDS: 'palette_painting_ids',
  LAST_SYNC_AT: 'sync_last_sync_at',
  COLLECTION_UPDATED_AT: 'sync_collection_updated_at',
};

/**
 * Reads the local collection entries from MMKV.
 */
export function readLocalCollection(storage: MMKV): any[] {
  const raw = storage.getString(STORAGE_KEYS.PAINTINGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes the local collection entries to MMKV.
 */
export function writeLocalCollection(storage: MMKV, collection: any[]): void {
  storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(collection));
}

/**
 * Reads the local palette painting IDs from MMKV.
 */
export function readLocalPaletteIds(storage: MMKV): string[] {
  const raw = storage.getString(STORAGE_KEYS.PALETTE_IDS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes the local palette painting IDs to MMKV.
 */
export function writeLocalPaletteIds(storage: MMKV, ids: string[]): void {
  storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(ids));
}

/**
 * Updates the collection updated_at tracking map in MMKV.
 */
export function updateCollectionTimestamp(storage: MMKV, paintingId: string, updatedAt: string): void {
  const raw = storage.getString(STORAGE_KEYS.COLLECTION_UPDATED_AT);
  let map: Record<string, string> = {};
  if (raw) {
    try {
      map = JSON.parse(raw);
    } catch {
      // ignore parse errors
    }
  }
  map[paintingId] = updatedAt;
  storage.set(STORAGE_KEYS.COLLECTION_UPDATED_AT, JSON.stringify(map));
}

/**
 * Removes a painting from the collection updated_at tracking map.
 */
export function removeCollectionTimestamp(storage: MMKV, paintingId: string): void {
  const raw = storage.getString(STORAGE_KEYS.COLLECTION_UPDATED_AT);
  if (!raw) return;
  try {
    const map: Record<string, string> = JSON.parse(raw);
    delete map[paintingId];
    storage.set(STORAGE_KEYS.COLLECTION_UPDATED_AT, JSON.stringify(map));
  } catch {
    // ignore parse errors
  }
}
