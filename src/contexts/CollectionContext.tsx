import type { Painting } from '@/types/painting';
import type { UserCollectionEntry } from '@/types/database';
import type { MMKV } from 'react-native-mmkv';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { mockPaintings } from '@/data/mockPaintings';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';

const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
};

type CollectionContextType = {
  paintings: Painting[];
  addToCollection: (painting: Painting) => void;
  removeFromCollection: (paintingId: string) => void;
  isInCollection: (paintingId: string) => boolean;
  toggleSeen: (paintingId: string) => void;
  toggleWantToVisit: (paintingId: string) => void;
  getPaintingsByArtist: () => Map<string, Painting[]>;
  getPaintingsByMuseum: () => Map<string, Painting[]>;
  /** Internal: allows SyncProvider to refresh paintings after sync */
  _refreshFromStorage: () => void;
};

const CollectionContext = createContext<CollectionContextType | undefined>(
  undefined,
);

type CollectionProviderProps = {
  readonly children: React.ReactNode;
  readonly storage: MMKV;
  readonly onLoaded: () => void;
};

export function CollectionProvider({
  children,
  storage,
  onLoaded,
}: CollectionProviderProps) {
  const { user } = useAuth();
  const { syncService, reportSyncError } = useSync();
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFromStorage = useCallback(() => {
    try {
      const savedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
      if (savedPaintings) {
        setPaintings(JSON.parse(savedPaintings));
      } else {
        const initialPaintings = mockPaintings.map((p) => ({
          ...p,
          dateAdded: new Date().toISOString(),
          wantToVisit: false,
        }));
        setPaintings(initialPaintings);
      }
      if (!isLoaded) {
        setIsLoaded(true);
        onLoaded();
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      setPaintings(mockPaintings);
      if (!isLoaded) {
        setIsLoaded(true);
        onLoaded();
      }
    }
  }, [storage, isLoaded, onLoaded]);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Persist paintings on change
  useEffect(() => {
    if (isLoaded) {
      try {
        storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(paintings));
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    }
  }, [paintings, isLoaded]);

  const _refreshFromStorage = useCallback(() => {
    const syncedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
    if (syncedPaintings) {
      const parsed = JSON.parse(syncedPaintings);
      setPaintings((prev: any) => {
        const prevJson = JSON.stringify(prev);
        const newJson = JSON.stringify(parsed);
        return prevJson === newJson ? prev : parsed;
      });
    }
  }, [storage]);

  const addToCollection = useCallback(
    (painting: Painting) => {
      setPaintings((previous) => {
        const exists = previous.some(
          (p) =>
            p.id === painting.id ||
            (p.title.toLowerCase() === painting.title.toLowerCase() &&
              p.artist.toLowerCase() === painting.artist.toLowerCase()),
        );

        if (exists) return previous;

        const newPainting: Painting = {
          ...painting,
          dateAdded: painting.dateAdded || new Date().toISOString(),
          isSeen: painting.isSeen || false,
          wantToVisit:
            painting.wantToVisit === undefined ? true : painting.wantToVisit,
        };

        if (user?.id) {
          const now = new Date().toISOString();
          const entry: UserCollectionEntry = {
            id: '',
            user_id: user.id,
            painting_id: newPainting.id,
            is_seen: newPainting.isSeen || false,
            want_to_visit: newPainting.wantToVisit || false,
            seen_date: newPainting.seenDate || null,
            date_added: newPainting.dateAdded || now,
            notes: newPainting.notes || null,
            created_at: now,
            updated_at: now,
          };
          syncService.upsertCollectionEntry(user.id, entry).catch((err) => {
            reportSyncError(err?.message || 'Failed to sync collection entry');
          });
        }

        return [...previous, newPainting];
      });
    },
    [user, syncService, reportSyncError],
  );

  const removeFromCollection = useCallback(
    (paintingId: string) => {
      setPaintings((previous) => previous.filter((p) => p.id !== paintingId));

      if (user?.id) {
        syncService.deleteCollectionEntry(user.id, paintingId).catch((err) => {
          reportSyncError(err?.message || 'Failed to sync collection removal');
        });
      }
    },
    [user, syncService, reportSyncError],
  );

  const isInCollection = useCallback(
    (paintingId: string): boolean => {
      return paintings.some((p) => p.id === paintingId);
    },
    [paintings],
  );

  const toggleSeen = useCallback(
    (paintingId: string) => {
      setPaintings((previous) => {
        const updated = previous.map((painting) =>
          painting.id === paintingId
            ? {
                ...painting,
                isSeen: !painting.isSeen,
                seenDate: painting.isSeen
                  ? undefined
                  : new Date().toISOString(),
                wantToVisit: false,
              }
            : painting,
        );

        if (user?.id) {
          const updatedPainting = updated.find((p) => p.id === paintingId);
          if (updatedPainting) {
            const now = new Date().toISOString();
            const entry: UserCollectionEntry = {
              id: '',
              user_id: user.id,
              painting_id: paintingId,
              is_seen: updatedPainting.isSeen || false,
              want_to_visit: updatedPainting.isSeen
                ? false
                : updatedPainting.wantToVisit || false,
              seen_date: updatedPainting.isSeen
                ? updatedPainting.seenDate || now
                : null,
              date_added: updatedPainting.dateAdded || now,
              notes: updatedPainting.notes || null,
              created_at: now,
              updated_at: now,
            };
            syncService.upsertCollectionEntry(user.id, entry).catch((err) => {
              reportSyncError(err?.message || 'Failed to sync seen status');
            });
          }
        }

        return updated;
      });
    },
    [user, syncService, reportSyncError],
  );

  const toggleWantToVisit = useCallback(
    (paintingId: string) => {
      setPaintings((previous) => {
        const updated = previous.map((painting) =>
          painting.id === paintingId
            ? {
                ...painting,
                isSeen: false,
                wantToVisit: !painting.wantToVisit,
              }
            : painting,
        );

        if (user?.id) {
          const updatedPainting = updated.find((p) => p.id === paintingId);
          if (updatedPainting) {
            const now = new Date().toISOString();
            const entry: UserCollectionEntry = {
              id: '',
              user_id: user.id,
              painting_id: paintingId,
              is_seen: updatedPainting.wantToVisit
                ? false
                : updatedPainting.isSeen || false,
              want_to_visit: updatedPainting.wantToVisit || false,
              seen_date: updatedPainting.wantToVisit
                ? null
                : updatedPainting.seenDate || null,
              date_added: updatedPainting.dateAdded || now,
              notes: updatedPainting.notes || null,
              created_at: now,
              updated_at: now,
            };
            syncService.upsertCollectionEntry(user.id, entry).catch((err) => {
              reportSyncError(
                err?.message || 'Failed to sync want-to-visit status',
              );
            });
          }
        }

        return updated;
      });
    },
    [user, syncService, reportSyncError],
  );

  const getPaintingsByArtist = useCallback((): Map<string, Painting[]> => {
    const grouped = new Map<string, Painting[]>();
    for (const painting of paintings) {
      const artist = painting.artist;
      if (!grouped.has(artist)) grouped.set(artist, []);
      grouped.get(artist)!.push(painting);
    }
    return new Map(
      [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    );
  }, [paintings]);

  const getPaintingsByMuseum = useCallback((): Map<string, Painting[]> => {
    const grouped = new Map<string, Painting[]>();
    for (const painting of paintings) {
      const museum = painting.museum || 'Unknown Museum';
      if (!grouped.has(museum)) grouped.set(museum, []);
      grouped.get(museum)!.push(painting);
    }
    return new Map(
      [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    );
  }, [paintings]);

  const value = useMemo(
    () => ({
      paintings,
      addToCollection,
      removeFromCollection,
      isInCollection,
      toggleSeen,
      toggleWantToVisit,
      getPaintingsByArtist,
      getPaintingsByMuseum,
      _refreshFromStorage,
    }),
    [
      paintings,
      addToCollection,
      removeFromCollection,
      isInCollection,
      toggleSeen,
      toggleWantToVisit,
      getPaintingsByArtist,
      getPaintingsByMuseum,
      _refreshFromStorage,
    ],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within CollectionProvider');
  }
  return context;
}
