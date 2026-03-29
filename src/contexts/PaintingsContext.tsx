import type { Painting } from '@/types/painting';
import type { UserCollectionEntry } from '@/types/database';
import type { MMKV } from 'react-native-mmkv';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { mockPaintings } from '@/data/mockPaintings';
import { createSyncService } from '@/services/syncService';
import { useAuth } from '@/contexts/AuthContext';

type PaintingsContextType = {
  paintings: Painting[];
  palettePaintingIds: number[];
  syncing: boolean;
  syncError: string | null;

  // Collection management
  addToCollection: (painting: Painting) => void;
  isInCollection: (paintingId: number) => boolean;
  removeFromCollection: (paintingId: number) => void;

  // Metadata actions
  toggleSeen: (paintingId: number) => void;
  toggleWantToVisit: (paintingId: number) => void;

  // Palette management
  addToPalette: (paintingId: number) => boolean;
  isPaintingInPalette: (paintingId: number) => boolean;
  removeFromPalette: (paintingId: number) => void;

  // Queries
  getPaintingsByArtist: () => Map<string, Painting[]>;
  getPaintingsByMuseum: () => Map<string, Painting[]>;
  getPalettePaintings: () => Painting[];
};

const PaintingsContext = createContext<PaintingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PAINTINGS: 'paintings_collection',
  PALETTE_IDS: 'palette_painting_ids',
};

type PaintingsProviderProps = {
  readonly children: React.ReactNode;
  readonly storage: MMKV;
};

export function PaintingsProvider({ children, storage }: PaintingsProviderProps) {
  const { user } = useAuth();
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [palettePaintingIds, setPalettePaintingIds] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncService = useMemo(() => createSyncService(storage), [storage]);
  // Keep a ref to paintings for use in async callbacks without stale closures
  const paintingsRef = useRef<Painting[]>(paintings);
  paintingsRef.current = paintings;

  // Load data from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save to storage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage();
    }
  }, [paintings, palettePaintingIds, isLoaded]);

  const loadFromStorage = useCallback(() => {
    try {
      // Load paintings
      const savedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
      if (savedPaintings) {
        const parsed = JSON.parse(savedPaintings);
        setPaintings(parsed);
      } else {
        // First time: Initialize with mock paintings
        const initialPaintings = mockPaintings.map(p => ({
          ...p,
          dateAdded: new Date().toISOString(),
          wantToVisit: false,
        }));
        setPaintings(initialPaintings);
      }

      // Load palette IDs
      const savedPaletteIds = storage.getString(STORAGE_KEYS.PALETTE_IDS);
      if (savedPaletteIds) {
        setPalettePaintingIds(JSON.parse(savedPaletteIds));
      } else {
        // Initialize with first 5 seen mock paintings
        const initialPalette = mockPaintings
          .filter(p => p.isSeen)
          .slice(0, 5)
          .map(p => p.id);
        setPalettePaintingIds(initialPalette);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading from storage:', error);
      // Fallback to mock data
      setPaintings(mockPaintings);
      setIsLoaded(true);
    }
  }, []);

  // Trigger sync-on-launch when user is authenticated
  useEffect(() => {
    if (!user?.id || !isLoaded) {
      return;
    }

    let cancelled = false;

    const runSync = async () => {
      setSyncing(true);
      setSyncError(null);

      try {
        await syncService.syncOnLaunch(user.id);

        if (!cancelled) {
          // Reload data from MMKV after sync has merged remote + local
          // Only update state if data actually changed to avoid unnecessary re-renders
          const syncedPaintings = storage.getString(STORAGE_KEYS.PAINTINGS);
          const syncedPaletteIds = storage.getString(STORAGE_KEYS.PALETTE_IDS);

          if (syncedPaintings) {
            const parsed = JSON.parse(syncedPaintings);
            setPaintings((prev: any) => {
              const prevJson = JSON.stringify(prev);
              const newJson = JSON.stringify(parsed);
              return prevJson === newJson ? prev : parsed;
            });
          }

          if (syncedPaletteIds) {
            const parsed = JSON.parse(syncedPaletteIds);
            setPalettePaintingIds((prev: any) => {
              const prevJson = JSON.stringify(prev);
              const newJson = JSON.stringify(parsed);
              return prevJson === newJson ? prev : parsed;
            });
          }

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
  }, [user?.id, isLoaded, syncService, loadFromStorage]);


  const saveToStorage = useCallback(() => {
    try {
      storage.set(STORAGE_KEYS.PAINTINGS, JSON.stringify(paintings));
      storage.set(STORAGE_KEYS.PALETTE_IDS, JSON.stringify(palettePaintingIds));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [paintings, palettePaintingIds]);

  // Add painting to collection (explicit action)
  // Can specify initial state
  const addToCollection = useCallback((painting: Painting) => {
    setPaintings(previous => {
      // Check if already exists
      const exists = previous.some(
        p => p.id === painting.id ||
        (p.title.toLowerCase() === painting.title.toLowerCase() &&
         p.artist.toLowerCase() === painting.artist.toLowerCase())
      );

      if (exists) {
        return previous;
      }

      // Add with metadata - preserve any state passed in, or default to Want to Visit
      const newPainting: Painting = {
        ...painting,
        dateAdded: painting.dateAdded || new Date().toISOString(),
        isSeen: painting.isSeen || false,
        wantToVisit: painting.wantToVisit === undefined ? true : painting.wantToVisit,
      };

      // Sync to remote if user is authenticated
      if (user?.id) {
        const now = new Date().toISOString();
        const entry: UserCollectionEntry = {
          id: '',
          user_id: user.id,
          painting_id: String(newPainting.id),
          is_seen: newPainting.isSeen || false,
          want_to_visit: newPainting.wantToVisit || false,
          seen_date: newPainting.seenDate || null,
          date_added: newPainting.dateAdded || now,
          notes: newPainting.notes || null,
          created_at: now,
          updated_at: now,
        };
        syncService.upsertCollectionEntry(user.id, entry).catch(err => {
          setSyncError(err?.message || 'Failed to sync collection entry');
        });
      }

      return [...previous, newPainting];
    });
  }, [user, syncService]);

  // Remove painting from collection
  const removeFromCollection = useCallback((paintingId: number) => {
    setPaintings(previous => previous.filter(p => p.id !== paintingId));
    // Also remove from palette if present
    setPalettePaintingIds(previous => previous.filter(id => id !== paintingId));

    // Sync deletion to remote
    if (user?.id) {
      syncService.deleteCollectionEntry(user.id, String(paintingId)).catch(err => {
        setSyncError(err?.message || 'Failed to sync collection removal');
      });
    }
  }, [user, syncService]);

  // Check if painting is in collection
  const isInCollection = useCallback((paintingId: number): boolean => {
    return paintings.some(p => p.id === paintingId);
  }, [paintings]);

  // Toggle painting as seen/unseen
  // Mutually exclusive with wantToVisit
  const toggleSeen = useCallback((paintingId: number) => {
    setPaintings(previous => {
      const updated = previous.map(painting =>
        painting.id === paintingId
          ? {
              ...painting,
              isSeen: !painting.isSeen,
              seenDate: painting.isSeen ? undefined : new Date().toISOString(),
              wantToVisit: painting.isSeen ? false : false, // If marking as seen, remove want to visit
            }
          : painting
      );

      // Sync the updated entry to remote
      if (user?.id) {
        const updatedPainting = updated.find(p => p.id === paintingId);
        if (updatedPainting) {
          const now = new Date().toISOString();
          const entry: UserCollectionEntry = {
            id: '',
            user_id: user.id,
            painting_id: String(paintingId),
            is_seen: updatedPainting.isSeen || false,
            want_to_visit: updatedPainting.isSeen ? false : (updatedPainting.wantToVisit || false),
            seen_date: updatedPainting.isSeen ? (updatedPainting.seenDate || now) : null,
            date_added: updatedPainting.dateAdded || now,
            notes: updatedPainting.notes || null,
            created_at: now,
            updated_at: now,
          };
          syncService.upsertCollectionEntry(user.id, entry).catch(err => {
            setSyncError(err?.message || 'Failed to sync seen status');
          });
        }
      }

      return updated;
    });
  }, [user, syncService]);

  // Toggle want to visit
  // Mutually exclusive with isSeen
  const toggleWantToVisit = useCallback((paintingId: number) => {
    setPaintings(previous => {
      const updated = previous.map(painting =>
        painting.id === paintingId
          ? {
              ...painting,
              isSeen: painting.wantToVisit ? false : false, // If marking as want to visit, remove seen
              wantToVisit: !painting.wantToVisit,
            }
          : painting
      );

      // Sync the updated entry to remote
      if (user?.id) {
        const updatedPainting = updated.find(p => p.id === paintingId);
        if (updatedPainting) {
          const now = new Date().toISOString();
          const entry: UserCollectionEntry = {
            id: '',
            user_id: user.id,
            painting_id: String(paintingId),
            is_seen: updatedPainting.wantToVisit ? false : (updatedPainting.isSeen || false),
            want_to_visit: updatedPainting.wantToVisit || false,
            seen_date: updatedPainting.wantToVisit ? null : (updatedPainting.seenDate || null),
            date_added: updatedPainting.dateAdded || now,
            notes: updatedPainting.notes || null,
            created_at: now,
            updated_at: now,
          };
          syncService.upsertCollectionEntry(user.id, entry).catch(err => {
            setSyncError(err?.message || 'Failed to sync want-to-visit status');
          });
        }
      }

      return updated;
    });
  }, [user, syncService]);

  // Add painting to palette (max 8)
  const addToPalette = useCallback((paintingId: number): boolean => {
    if (palettePaintingIds.includes(paintingId)) {
      return true;
    }

    if (palettePaintingIds.length >= 8) {
      return false;
    }

    const newIds = [...palettePaintingIds, paintingId];
    setPalettePaintingIds(newIds);

    // Sync palette to remote
    if (user?.id) {
      syncService.upsertPalette(user.id, newIds.map(String)).catch(err => {
        setSyncError(err?.message || 'Failed to sync palette');
      });
    }

    return true;
  }, [palettePaintingIds, user, syncService]);

  // Remove painting from palette
  const removeFromPalette = useCallback((paintingId: number) => {
    const newIds = palettePaintingIds.filter(id => id !== paintingId);
    setPalettePaintingIds(newIds);

    // Sync palette to remote
    if (user?.id) {
      syncService.upsertPalette(user.id, newIds.map(String)).catch(err => {
        setSyncError(err?.message || 'Failed to sync palette');
      });
    }
  }, [palettePaintingIds, user, syncService]);

  // Check if painting is in palette
  const isPaintingInPalette = useCallback((paintingId: number): boolean => {
    return palettePaintingIds.includes(paintingId);
  }, [palettePaintingIds]);

  // Get palette paintings
  const getPalettePaintings = useCallback((): Painting[] => {
    return palettePaintingIds
      .map(id => paintings.find(p => p.id === id))
      .filter((p): p is Painting => p !== undefined);
  }, [palettePaintingIds, paintings]);

  // Get paintings grouped by artist
  const getPaintingsByArtist = useCallback((): Map<string, Painting[]> => {
    const grouped = new Map<string, Painting[]>();

    for (const painting of paintings) {
      const artist = painting.artist;
      if (!grouped.has(artist)) {
        grouped.set(artist, []);
      }
      grouped.get(artist)!.push(painting);
    }

    // Sort by artist name
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [paintings]);

  // Get paintings grouped by museum
  const getPaintingsByMuseum = useCallback((): Map<string, Painting[]> => {
    const grouped = new Map<string, Painting[]>();

    for (const painting of paintings) {
      const museum = painting.museum || 'Unknown Museum';
      if (!grouped.has(museum)) {
        grouped.set(museum, []);
      }
      grouped.get(museum)!.push(painting);
    }

    // Sort by museum name
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [paintings]);

  return (
    <PaintingsContext.Provider
      value={{
        addToCollection,
        addToPalette,
        getPaintingsByArtist,
        getPaintingsByMuseum,
        getPalettePaintings,
        isInCollection,
        isPaintingInPalette,
        paintings,
        palettePaintingIds,
        removeFromCollection,
        removeFromPalette,
        syncing,
        syncError,
        toggleSeen,
        toggleWantToVisit,
      }}
    >
      {children}
    </PaintingsContext.Provider>
  );
}

export function usePaintings() {
  const context = useContext(PaintingsContext);
  if (!context) {
    throw new Error('usePaintings must be used within PaintingsProvider');
  }
  return context;
}