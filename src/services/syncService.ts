import { MMKV } from 'react-native-mmkv';
import { supabase } from './supabase';
import { offlineQueue, type QueuedOperation } from './offlineQueue';
import type { UserCollectionEntry, UserPalette } from '@/types/database';

const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
  PALETTE_IDS: 'palette_painting_ids',
  LAST_SYNC_AT: 'sync_last_sync_at',
  COLLECTION_UPDATED_AT: 'sync_collection_updated_at',
};

/**
 * Generates a simple unique ID for queued operations.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class SyncService {
  private _isSyncing = false;
  private storage: MMKV;

  constructor(storage: MMKV) {
    this.storage = storage;
  }

  /**
   * Returns whether the service is currently performing a sync operation.
   */
  isSyncing(): boolean {
    return this._isSyncing;
  }

  /**
   * Sets the syncing state. Used internally by syncOnLaunch.
   */
  setSyncing(syncing: boolean): void {
    this._isSyncing = syncing;
  }

  /**
   * Reads the local collection entries from MMKV.
   */
  private readLocalCollection(): any[] {
    const raw = this.storage.getString(STORAGE_KEYS.PAINTINGS);
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
  private writeLocalCollection(collection: any[]): void {
    this.storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(collection));
  }

  /**
   * Reads the local palette painting IDs from MMKV.
   */
  private readLocalPaletteIds(): string[] {
    const raw = this.storage.getString(STORAGE_KEYS.PALETTE_IDS);
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
  private writeLocalPaletteIds(ids: string[]): void {
    this.storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(ids));
  }

  /**
   * Updates the collection updated_at tracking map in MMKV.
   */
  private updateCollectionTimestamp(paintingId: string, updatedAt: string): void {
    const raw = this.storage.getString(STORAGE_KEYS.COLLECTION_UPDATED_AT);
    let map: Record<string, string> = {};
    if (raw) {
      try {
        map = JSON.parse(raw);
      } catch {
        // ignore parse errors
      }
    }
    map[paintingId] = updatedAt;
    this.storage.set(STORAGE_KEYS.COLLECTION_UPDATED_AT, JSON.stringify(map));
  }

  /**
   * Removes a painting from the collection updated_at tracking map.
   */
  private removeCollectionTimestamp(paintingId: string): void {
    const raw = this.storage.getString(STORAGE_KEYS.COLLECTION_UPDATED_AT);
    if (!raw) return;
    try {
      const map: Record<string, string> = JSON.parse(raw);
      delete map[paintingId];
      this.storage.set(STORAGE_KEYS.COLLECTION_UPDATED_AT, JSON.stringify(map));
    } catch {
      // ignore parse errors
    }
  }

  /**
   * Enqueues an operation to the offline queue for later replay.
   */
  private enqueueOperation(
    type: QueuedOperation['type'],
    payload: any,
  ): void {
    const operation: QueuedOperation = {
      id: generateId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    offlineQueue.enqueue(operation);
  }

  /**
   * Upserts a collection entry: writes to MMKV immediately, then syncs to Supabase.
   * If isSyncing is true or network fails, the operation is enqueued for later replay.
   *
   * Requirements: 2.2, 2.4, 6.1
   */
  async upsertCollectionEntry(
    userId: string,
    entry: UserCollectionEntry,
  ): Promise<void> {
    // Write to MMKV immediately for instant UI response
    const now = new Date().toISOString();
    const entryWithTimestamp = {
      ...entry,
      updated_at: entry.updated_at || now,
    };

    this.updateCollectionTimestamp(entry.painting_id, entryWithTimestamp.updated_at);

    // If currently syncing, queue the write instead of sending to Supabase
    if (this._isSyncing) {
      this.enqueueOperation('upsert_collection', {
        userId,
        entry: entryWithTimestamp,
      });
      return;
    }

    // Attempt to write to Supabase — painting_id is already a UUID
    try {
      const { error } = await supabase
        .from('user_collection')
        .upsert(
          {
            user_id: userId,
            painting_id: entry.painting_id,
            is_seen: entry.is_seen,
            want_to_visit: entry.want_to_visit,
            seen_date: entry.seen_date,
            date_added: entry.date_added,
            notes: entry.notes,
            updated_at: entryWithTimestamp.updated_at,
          },
          { onConflict: 'user_id,painting_id' },
        );

      if (error) {
        throw error;
      }
    } catch (err: any) {
      // Network failure or Supabase error — log and enqueue for later
      console.error(`[SyncService] upsertCollectionEntry failed for painting ${entry.painting_id}:`, err?.message || err);
      this.enqueueOperation('upsert_collection', {
        userId,
        entry: entryWithTimestamp,
      });
    }
  }

  /**
   * Deletes a collection entry: removes from MMKV immediately, then deletes from Supabase.
   * If isSyncing is true or network fails, the operation is enqueued for later replay.
   *
   * Requirements: 2.3, 6.1
   */
  async deleteCollectionEntry(
    userId: string,
    paintingId: string,
  ): Promise<void> {
    // Update MMKV tracking
    this.removeCollectionTimestamp(paintingId);

    // If currently syncing, queue the delete
    if (this._isSyncing) {
      this.enqueueOperation('delete_collection', {
        userId,
        paintingId,
      });
      return;
    }

    // Attempt to delete from Supabase — paintingId is already a UUID
    try {
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('user_id', userId)
        .eq('painting_id', paintingId);

      if (error) {
        throw error;
      }
    } catch {
      // Network failure — enqueue for later
      this.enqueueOperation('delete_collection', {
        userId,
        paintingId,
      });
    }
  }

  /**
   * Upserts the user's palette: writes to MMKV immediately, then syncs to Supabase.
   * If isSyncing is true or network fails, the operation is enqueued for later replay.
   *
   * Requirements: 3.2, 3.3, 6.1
   */
  async upsertPalette(
    userId: string,
    paintingIds: string[],
  ): Promise<void> {
    // Write to MMKV immediately
    this.writeLocalPaletteIds(paintingIds);

    // If currently syncing, queue the write
    if (this._isSyncing) {
      this.enqueueOperation('upsert_palette', {
        userId,
        paintingIds,
      });
      return;
    }

    // Attempt to write to Supabase — paintingIds are already UUIDs
    if (paintingIds.length === 0) {
      console.warn('[SyncService] No painting UUIDs provided for palette');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_palette')
        .upsert(
          {
            user_id: userId,
            painting_ids: paintingIds,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );

      if (error) {
        throw error;
      }
    } catch {
      // Network failure — enqueue for later
      this.enqueueOperation('upsert_palette', {
        userId,
        paintingIds,
      });
    }
  }

  /**
   * Returns the current offline queue length.
   */
  getQueueLength(): number {
    return offlineQueue.size();
  }

  // --- Stub methods for future tasks (6.1, 6.2, 6.3) ---

  /**
   * Syncs data on app launch by fetching remote data and merging with local cache.
   * Stub — will be implemented in Task 6.2.
   */
  /**
     * Syncs data on app launch by fetching remote data and merging with local cache.
     *
     * Flow:
     * 1. Set isSyncing to true (writes during sync are queued)
     * 2. Fetch user_collection and user_palette from Supabase
     * 3. Read local MMKV data
     * 4. Merge remote + local using timestamp-based conflict resolution
     * 5. Write merged state to MMKV
     * 6. Replay queued operations on top of merged data
     * 7. Set isSyncing to false
     *
     * On fetch failure: set isSyncing to false, fall back to MMKV data, surface error.
     *
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
     */
    async syncOnLaunch(userId: string): Promise<void> {
      this.setSyncing(true);

      try {
        // Fetch remote data from Supabase
        const [collectionResult, paletteResult] = await Promise.all([
          supabase
            .from('user_collection')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('user_palette')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
        ]);

        if (collectionResult.error) {
          throw collectionResult.error;
        }
        if (paletteResult.error) {
          throw paletteResult.error;
        }

        const remoteCollection: UserCollectionEntry[] = collectionResult.data ?? [];
        const remotePalette: UserPalette | null = paletteResult.data ?? null;

        // Read local MMKV data — these are Painting[] objects, NOT UserCollectionEntry[]
        const localPaintings = this.readLocalCollection();
        const localPaletteIds = this.readLocalPaletteIds();

        // Build a set of local painting IDs (as strings) for quick lookup
        const localIdSet = new Set(localPaintings.map((p: any) => String(p.id)));

        if (remoteCollection.length > 0) {
          // Map remote entries by painting_id (UUID) for metadata merge
          const remoteByUuid = new Map<string, UserCollectionEntry>();
          for (const entry of remoteCollection) {
            remoteByUuid.set(entry.painting_id, entry);
          }

          // Fetch the actual painting records from the paintings table for all remote entries
          const remoteUuids = remoteCollection.map(e => e.painting_id);
          const { data: remotePaintingRows } = await supabase
            .from('paintings')
            .select('*')
            .in('id', remoteUuids);

          // Build a map of UUID → painting row for quick lookup
          const remotePaintingRowMap = new Map<string, any>();
          for (const row of (remotePaintingRows || [])) {
            remotePaintingRowMap.set(row.id, row);
          }

          // 1. Update metadata on paintings that exist locally (match by UUID directly)
          for (const painting of localPaintings) {
            const remoteEntry = remoteByUuid.get(String(painting.id));
            if (remoteEntry) {
              painting.isSeen = remoteEntry.is_seen;
              painting.wantToVisit = remoteEntry.want_to_visit;
              painting.seenDate = remoteEntry.seen_date || undefined;
              painting.notes = remoteEntry.notes || undefined;
            }
          }

          // 2. Add remote-only paintings to local collection
          for (const row of (remotePaintingRows || [])) {
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

        // Write updated local paintings back to MMKV (preserving the Painting[] shape)
        this.writeLocalCollection(localPaintings);

        // Palette sync: store remote palette UUIDs directly in local storage
        if (remotePalette && remotePalette.painting_ids.length > 0) {
          // Remote palette painting_ids are already UUIDs — store directly
          this.writeLocalPaletteIds(remotePalette.painting_ids);
        }

        // Record last sync time
        const now = new Date().toISOString();
        this.storage.set(STORAGE_KEYS.LAST_SYNC_AT, now);

        // Set isSyncing to false before replaying queue so replayed ops go directly to Supabase
        this.setSyncing(false);

        // Replay queued operations on top of merged data (Req 4.6, 4.7)
        // These are operations that were enqueued during the sync window
        await this.replayQueue();
      } catch (_error) {
        // Fetch failure: fall back to MMKV data (already in place), surface non-blocking error
        this.setSyncing(false);

        // Re-throw so the caller (PaintingsContext) can surface the error as a non-blocking notification
        throw _error;
      }
    }


  /**
   * Replays all queued offline operations to Supabase.
   * Stub — will be implemented in Task 6.3.
   */
  async replayQueue(): Promise<void> {
      const MAX_RETRIES = 3;

      let operation = offlineQueue.peek();
      while (operation) {
        let success = false;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            await this.executeOperation(operation);
            success = true;
            break;
          } catch (error) {
            if (attempt === MAX_RETRIES) {
              console.error(
                `[SyncService] Permanent failure for operation ${operation.id} (type: ${operation.type}) after ${MAX_RETRIES} retries:`,
                error,
              );
            }
          }
        }

        // Remove from queue regardless — on permanent failure we retain MMKV state
        offlineQueue.remove(operation.id);

        operation = offlineQueue.peek();
      }
    }

    private async executeOperation(operation: QueuedOperation): Promise<void> {
      switch (operation.type) {
        case 'upsert_collection': {
          const { userId, entry } = operation.payload;
          // painting_id is already a UUID — no resolution needed
          const { error } = await supabase
            .from('user_collection')
            .upsert(
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
          // paintingId is already a UUID — no resolution needed
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
          // paintingIds are already UUIDs — no resolution needed
          if (paintingIds.length === 0) return;
          const { error } = await supabase
            .from('user_palette')
            .upsert(
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
        default:
          console.warn(`[SyncService] Unknown operation type: ${(operation as any).type}`);
      }
    }

}

/**
 * Factory function to create a SyncService instance.
 * The storage parameter should be the same MMKV instance used by PaintingsContext.
 */
export function createSyncService(storage: MMKV): SyncService {
  return new SyncService(storage);
}

/**
 * Pure function that merges local and remote collection entries using timestamp-based
 * conflict resolution.
 *
 * Rules:
 * - Entries present in both: keep the one with the more recent `updated_at`; remote wins on tie
 * - Entries only in remote: include in result
 * - Entries only in local: include in result
 *
 * Requirements: 4.2
 */
export function mergeCollectionData(
  local: UserCollectionEntry[],
  remote: UserCollectionEntry[],
): UserCollectionEntry[] {
  const remoteMap = new Map<string, UserCollectionEntry>();
  for (const entry of remote) {
    remoteMap.set(entry.painting_id, entry);
  }

  const merged = new Map<string, UserCollectionEntry>();

  // Process local entries — check for conflicts with remote
  for (const localEntry of local) {
    const remoteEntry = remoteMap.get(localEntry.painting_id);
    if (remoteEntry) {
      // Present in both: compare updated_at timestamps, remote wins on tie
      const localTime = new Date(localEntry.updated_at).getTime();
      const remoteTime = new Date(remoteEntry.updated_at).getTime();
      merged.set(
        localEntry.painting_id,
        localTime > remoteTime ? localEntry : remoteEntry,
      );
      remoteMap.delete(localEntry.painting_id);
    } else {
      // Only in local
      merged.set(localEntry.painting_id, localEntry);
    }
  }

  // Remaining remote entries are only in remote
  for (const [paintingId, remoteEntry] of remoteMap) {
    merged.set(paintingId, remoteEntry);
  }

  return Array.from(merged.values());
}

/**
 * Pure function that merges local and remote palette data using palette-level
 * `updated_at` timestamps.
 *
 * Rules:
 * - Compare palette-level `updated_at` timestamps
 * - Keep the palette with the more recent `updated_at`; remote wins on tie
 * - If one side is null/undefined, use the other
 *
 * Requirements: 4.2
 */
export function mergePaletteData(
  local: UserPalette | null,
  remote: UserPalette | null,
): UserPalette | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();

  // Remote wins on tie
  return localTime > remoteTime ? local : remote;
}
