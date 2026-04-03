import type { UserCollectionEntry, UserPalette } from '@/types/database';

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
