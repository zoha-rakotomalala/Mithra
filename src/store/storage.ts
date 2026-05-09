import { MMKV } from 'react-native-mmkv';

export const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
  PALETTE_IDS: 'palette_painting_ids',
  LAST_SYNC_AT: 'sync_last_sync_at',
  COLLECTION_UPDATED_AT: 'sync_collection_updated_at',
  DEAD_LETTER_QUEUE: 'sync_dead_letter_queue',
} as const;

export const storage = new MMKV();
export const syncQueueStorage = new MMKV({ id: 'sync-queue' });
