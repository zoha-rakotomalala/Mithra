import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from './index';
import * as syncService from './syncService';
import type { UserCollectionEntry } from '@/types/database';

export function useSyncOnLaunch() {
  const { user } = useAuth();
  const isLoaded = useAppStore((s) => s.isLoaded);

  useEffect(() => {
    if (!user?.id || !isLoaded) return;
    let cancelled = false;

    syncService.syncOnLaunch(user.id).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoaded]);
}

export function useSyncActions() {
  const { user } = useAuth();

  const syncCollectionEntry = (paintingId: string, updates: Partial<{
    is_seen: boolean;
    want_to_visit: boolean;
    seen_date: string | null;
    date_added: string;
    notes: string | null;
  }>) => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    const entry: UserCollectionEntry = {
      id: '',
      user_id: user.id,
      painting_id: paintingId,
      is_seen: updates.is_seen ?? false,
      want_to_visit: updates.want_to_visit ?? false,
      seen_date: updates.seen_date ?? null,
      date_added: updates.date_added ?? now,
      notes: updates.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    syncService.upsertCollectionEntry(user.id, entry);
  };

  const syncDeleteEntry = (paintingId: string) => {
    if (!user?.id) return;
    syncService.deleteCollectionEntry(user.id, paintingId);
  };

  const syncPalette = (paintingIds: string[]) => {
    if (!user?.id) return;
    syncService.upsertPalette(user.id, paintingIds);
  };

  return { syncCollectionEntry, syncDeleteEntry, syncPalette };
}
