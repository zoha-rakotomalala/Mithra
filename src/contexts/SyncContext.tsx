import type { MMKV } from 'react-native-mmkv';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createSyncService } from '@/services/syncService';
import { useAuth } from '@/contexts/AuthContext';

type SyncContextType = {
  syncing: boolean;
  syncError: string | null;
  syncService: ReturnType<typeof createSyncService>;
  reportSyncError: (error: string) => void;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

type SyncProviderProps = {
  readonly children: React.ReactNode;
  readonly storage: MMKV;
  readonly isLoaded: boolean;
  readonly onSyncComplete: () => void;
};

export function SyncProvider({
  children,
  storage,
  isLoaded,
  onSyncComplete,
}: SyncProviderProps) {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncService = useMemo(() => createSyncService(storage), [storage]);

  const reportSyncError = useCallback((error: string) => {
    setSyncError(error);
  }, []);

  useEffect(() => {
    if (!user?.id || !isLoaded) return;

    let cancelled = false;

    const runSync = async () => {
      setSyncing(true);
      setSyncError(null);

      try {
        await syncService.syncOnLaunch(user.id);

        if (!cancelled) {
          onSyncComplete();
          setSyncing(false);
        }
      } catch (error: any) {
        if (!cancelled) {
          setSyncing(false);
          setSyncError(error?.message || 'Failed to sync on launch');
        }
      }
    };

    runSync();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoaded, syncService]);

  const value = useMemo(
    () => ({
      syncing,
      syncError,
      syncService,
      reportSyncError,
    }),
    [syncing, syncError, syncService, reportSyncError],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}
