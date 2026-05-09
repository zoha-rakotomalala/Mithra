import { supabase } from '@/services/supabase';
import { offlineQueue } from '@/services/offlineQueue';
import type { UserCollectionEntry, UserPalette } from '@/types/database';
import type { QueuedOperation, DeadLetterItem } from './types';
import { useAppStore } from './index';
import { storage, STORAGE_KEYS } from './storage';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueOperation(type: QueuedOperation['type'], payload: any): void {
  const operation: QueuedOperation = {
    id: generateId(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  offlineQueue.enqueue(operation);
}

export async function upsertCollectionEntry(
  userId: string,
  entry: UserCollectionEntry,
): Promise<void> {
  const store = useAppStore.getState();

  if (store.syncing) {
    enqueueOperation('upsert_collection', { userId, entry });
    return;
  }

  try {
    const { error } = await supabase.from('user_collection').upsert(
      {
        user_id: userId,
        painting_id: entry.painting_id,
        is_seen: entry.is_seen,
        want_to_visit: entry.want_to_visit,
        seen_date: entry.seen_date,
        date_added: entry.date_added,
        notes: entry.notes,
        updated_at: entry.updated_at || new Date().toISOString(),
      },
      { onConflict: 'user_id,painting_id' },
    );
    if (error) throw error;
  } catch {
    enqueueOperation('upsert_collection', { userId, entry });
  }
}

export async function deleteCollectionEntry(
  userId: string,
  paintingId: string,
): Promise<void> {
  const store = useAppStore.getState();

  if (store.syncing) {
    enqueueOperation('delete_collection', { userId, paintingId });
    return;
  }

  try {
    const { error } = await supabase
      .from('user_collection')
      .delete()
      .eq('user_id', userId)
      .eq('painting_id', paintingId);
    if (error) throw error;
  } catch {
    enqueueOperation('delete_collection', { userId, paintingId });
  }
}

export async function upsertPalette(
  userId: string,
  paintingIds: string[],
): Promise<void> {
  const store = useAppStore.getState();

  if (store.syncing) {
    enqueueOperation('upsert_palette', { userId, paintingIds });
    return;
  }

  if (paintingIds.length === 0) return;

  try {
    const { error } = await supabase.from('user_palette').upsert(
      {
        user_id: userId,
        painting_ids: paintingIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
  } catch {
    enqueueOperation('upsert_palette', { userId, paintingIds });
  }
}

export async function syncOnLaunch(userId: string): Promise<void> {
  const store = useAppStore.getState();
  store.setSyncing(true);
  store.setSyncError(null);

  try {
    const [collectionResult, paletteResult] = await Promise.all([
      supabase.from('user_collection').select('*').eq('user_id', userId),
      supabase
        .from('user_palette')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (collectionResult.error) throw collectionResult.error;
    if (paletteResult.error) throw paletteResult.error;

    const remoteCollection: UserCollectionEntry[] =
      collectionResult.data ?? [];
    const remotePalette: UserPalette | null = paletteResult.data ?? null;

    const localPaintings = [...store.paintings];
    const localIdSet = new Set(localPaintings.map((p) => String(p.id)));

    if (remoteCollection.length > 0) {
      const remoteByUuid = new Map<string, UserCollectionEntry>();
      for (const entry of remoteCollection) {
        remoteByUuid.set(entry.painting_id, entry);
      }

      const remoteUuids = remoteCollection.map((e) => e.painting_id);
      const { data: remotePaintingRows } = await supabase
        .from('paintings')
        .select('*')
        .in('id', remoteUuids);

      // Build a map of painting rows for image URL lookups
      const remotePaintingRowMap = new Map<string, any>();
      for (const row of remotePaintingRows || []) {
        remotePaintingRowMap.set(row.id, row);
      }

      // Update metadata and fill missing image URLs on paintings that exist locally
      for (const painting of localPaintings) {
        const remoteEntry = remoteByUuid.get(String(painting.id));
        if (remoteEntry) {
          painting.isSeen = remoteEntry.is_seen;
          painting.wantToVisit = remoteEntry.want_to_visit;
          painting.seenDate = remoteEntry.seen_date || undefined;
          painting.notes = remoteEntry.notes || undefined;
        }

        // Fill missing image URLs from the paintings table
        if (!painting.imageUrl || !painting.thumbnailUrl) {
          const row = remotePaintingRowMap.get(String(painting.id));
          if (row) {
            const m = row.metadata || {};
            if (!painting.imageUrl) {
              painting.imageUrl = row.image_url || (m.image_id
                ? `https://www.artic.edu/iiif/2/${m.image_id}/full/843,/0/default.jpg`
                : undefined);
            }
            if (!painting.thumbnailUrl) {
              painting.thumbnailUrl = row.thumbnail_url || (m.image_id
                ? `https://www.artic.edu/iiif/2/${m.image_id}/full/200,/0/default.jpg`
                : undefined);
            }
          }
        }
      }

      // Add remote-only paintings to local collection
      for (const row of remotePaintingRows || []) {
        if (!localIdSet.has(row.id)) {
          const remoteEntry = remoteByUuid.get(row.id);
          const m = row.metadata || {};
          let imageUrl = row.image_url;
          let thumbnailUrl = row.thumbnail_url;
          if (!imageUrl && m.image_id) {
            imageUrl = `https://www.artic.edu/iiif/2/${m.image_id}/full/843,/0/default.jpg`;
            thumbnailUrl = `https://www.artic.edu/iiif/2/${m.image_id}/full/200,/0/default.jpg`;
          }
          localPaintings.push({
            id: row.id,
            title: row.title,
            artist: row.artist,
            year: row.year,
            imageUrl,
            thumbnailUrl,
            color: row.color,
            museum: m.museum || row.museum_id,
            description: m.description,
            medium: m.medium || row.medium,
            dimensions: m.dimensions || row.dimensions,
            location: m.location,
            objectURL: m.objectURL,
            period: m.period,
            culture: m.culture,
            department: m.department,
            dateAdded: remoteEntry?.date_added || new Date().toISOString(),
            isSeen: remoteEntry?.is_seen || false,
            wantToVisit: remoteEntry?.want_to_visit || false,
            seenDate: remoteEntry?.seen_date || undefined,
            notes: remoteEntry?.notes || undefined,
          });
          localIdSet.add(row.id);
        }
      }
    }

    // Write merged state to store (triggers subscribers) and MMKV
    store.setPaintings(localPaintings);

    // Palette sync
    if (remotePalette && remotePalette.painting_ids.length > 0) {
      store.setPalettePaintingIds(remotePalette.painting_ids);
    }

    // Record last sync time
    storage.set(STORAGE_KEYS.LAST_SYNC_AT, new Date().toISOString());

    // Must set syncing false BEFORE replaying queue
    store.setSyncing(false);

    await replayQueue();
  } catch (error: any) {
    store.setSyncing(false);
    store.setSyncError(error?.message || 'Failed to sync on launch');
  }
}

async function replayQueue(): Promise<void> {
  const store = useAppStore.getState();

  let operation = offlineQueue.peek();
  while (operation) {
    let succeeded = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await executeOperation(operation);
        succeeded = true;
        break;
      } catch (error: any) {
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        } else {
          // Permanent failure — move to dead letter queue
          const deadItem: DeadLetterItem = {
            operation,
            failedAt: new Date().toISOString(),
            lastError: error?.message || 'Unknown error',
          };
          store.addToDeadLetter(deadItem);
        }
      }
    }

    offlineQueue.remove(operation.id);

    if (!succeeded) {
      // Log for debugging but don't throw — continue processing the queue
    }

    operation = offlineQueue.peek();
  }
}

async function executeOperation(operation: QueuedOperation): Promise<void> {
  switch (operation.type) {
    case 'upsert_collection': {
      const { userId, entry } = operation.payload;
      const { error } = await supabase.from('user_collection').upsert(
        {
          user_id: userId,
          painting_id: entry.painting_id,
          is_seen: entry.is_seen,
          want_to_visit: entry.want_to_visit,
          seen_date: entry.seen_date,
          date_added: entry.date_added,
          notes: entry.notes,
          updated_at: entry.updated_at,
        },
        { onConflict: 'user_id,painting_id' },
      );
      if (error) throw error;
      break;
    }
    case 'delete_collection': {
      const { userId, paintingId } = operation.payload;
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('user_id', userId)
        .eq('painting_id', paintingId);
      if (error) throw error;
      break;
    }
    case 'upsert_palette': {
      const { userId, paintingIds } = operation.payload;
      if (paintingIds.length === 0) return;
      const { error } = await supabase.from('user_palette').upsert(
        {
          user_id: userId,
          painting_ids: paintingIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
      break;
    }
  }
}
