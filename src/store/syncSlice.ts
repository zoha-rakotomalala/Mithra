import type { StateCreator } from 'zustand';
import type { AppStore, DeadLetterItem, SyncSlice } from './types';
import { storage, STORAGE_KEYS } from './storage';

export const createSyncSlice: StateCreator<
  AppStore,
  [],
  [],
  SyncSlice
> = (set, get) => ({
  syncing: false,
  syncError: null,
  deadLetterQueue: loadDeadLetterQueue(),

  setSyncing: (syncing: boolean) => {
    set({ syncing });
  },

  setSyncError: (error: string | null) => {
    set({ syncError: error });
  },

  addToDeadLetter: (item: DeadLetterItem) => {
    const { deadLetterQueue } = get();
    const updated = [...deadLetterQueue, item];
    set({ deadLetterQueue: updated });
    persistDeadLetterQueue(updated);
  },

  removeFromDeadLetter: (operationId: string) => {
    const { deadLetterQueue } = get();
    const updated = deadLetterQueue.filter(
      (item) => item.operation.id !== operationId,
    );
    set({ deadLetterQueue: updated });
    persistDeadLetterQueue(updated);
  },

  retryDeadLetterItem: (operationId: string) => {
    const { deadLetterQueue } = get();
    const item = deadLetterQueue.find((i) => i.operation.id === operationId);
    if (!item) return;

    // Remove from dead letter — the sync service will pick it up
    const updated = deadLetterQueue.filter(
      (i) => i.operation.id !== operationId,
    );
    set({ deadLetterQueue: updated });
    persistDeadLetterQueue(updated);

    // Re-enqueue via the offline queue (imported lazily to avoid circular deps)
    const { offlineQueue } = require('@/services/offlineQueue');
    offlineQueue.enqueue({ ...item.operation, retryCount: 0 });
  },

  clearDeadLetter: () => {
    set({ deadLetterQueue: [] });
    storage.delete(STORAGE_KEYS.DEAD_LETTER_QUEUE);
  },
});

function loadDeadLetterQueue(): DeadLetterItem[] {
  try {
    const raw = storage.getString(STORAGE_KEYS.DEAD_LETTER_QUEUE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistDeadLetterQueue(queue: DeadLetterItem[]): void {
  storage.set(STORAGE_KEYS.DEAD_LETTER_QUEUE, JSON.stringify(queue));
}
