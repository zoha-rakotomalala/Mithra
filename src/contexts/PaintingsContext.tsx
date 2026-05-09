/**
 * PaintingsContext — Backward-compatible facade that reads from the Zustand store.
 *
 * Existing screens can continue using `usePaintings()` unchanged.
 * New code should use `useAppStore(selector)` directly for fine-grained subscriptions.
 */
import { useAppStore } from '@/store';
import { useSyncActions } from '@/store/useSync';
import type { Painting } from '@/types/painting';

export function usePaintings() {
  const paintings = useAppStore((s) => s.paintings);
  const addToCollectionStore = useAppStore((s) => s.addToCollection);
  const removeFromCollectionStore = useAppStore((s) => s.removeFromCollection);
  const isInCollection = useAppStore((s) => s.isInCollection);
  const toggleSeenStore = useAppStore((s) => s.toggleSeen);
  const toggleWantToVisitStore = useAppStore((s) => s.toggleWantToVisit);
  const getPaintingsByArtist = useAppStore((s) => s.getPaintingsByArtist);
  const getPaintingsByMuseum = useAppStore((s) => s.getPaintingsByMuseum);
  const palettePaintingIds = useAppStore((s) => s.palettePaintingIds);
  const addToPaletteStore = useAppStore((s) => s.addToPalette);
  const removeFromPaletteStore = useAppStore((s) => s.removeFromPalette);
  const isPaintingInPalette = useAppStore((s) => s.isPaintingInPalette);
  const getPalettePaintings = useAppStore((s) => s.getPalettePaintings);
  const syncing = useAppStore((s) => s.syncing);
  const syncError = useAppStore((s) => s.syncError);

  const { syncCollectionEntry, syncDeleteEntry, syncPalette } = useSyncActions();

  const addToCollection = (painting: Painting) => {
    addToCollectionStore(painting);
    syncCollectionEntry(painting.id, {
      is_seen: painting.isSeen || false,
      want_to_visit: painting.wantToVisit || false,
      seen_date: painting.seenDate || null,
      date_added: painting.dateAdded || new Date().toISOString(),
      notes: painting.notes || null,
    });
  };

  const removeFromCollection = (paintingId: string) => {
    removeFromCollectionStore(paintingId);
    syncDeleteEntry(paintingId);
  };

  const toggleSeen = (paintingId: string) => {
    toggleSeenStore(paintingId);
    const updated = useAppStore.getState().paintings.find((p) => p.id === paintingId);
    if (updated) {
      syncCollectionEntry(paintingId, {
        is_seen: updated.isSeen || false,
        want_to_visit: false,
        seen_date: updated.isSeen ? (updated.seenDate || new Date().toISOString()) : null,
        date_added: updated.dateAdded || new Date().toISOString(),
        notes: updated.notes || null,
      });
    }
  };

  const toggleWantToVisit = (paintingId: string) => {
    toggleWantToVisitStore(paintingId);
    const updated = useAppStore.getState().paintings.find((p) => p.id === paintingId);
    if (updated) {
      syncCollectionEntry(paintingId, {
        is_seen: false,
        want_to_visit: updated.wantToVisit || false,
        seen_date: null,
        date_added: updated.dateAdded || new Date().toISOString(),
        notes: updated.notes || null,
      });
    }
  };

  const addToPalette = (paintingId: string): boolean => {
    const result = addToPaletteStore(paintingId);
    if (result) {
      const ids = useAppStore.getState().palettePaintingIds;
      syncPalette(ids);
    }
    return result;
  };

  const removeFromPalette = (paintingId: string) => {
    removeFromPaletteStore(paintingId);
    const ids = useAppStore.getState().palettePaintingIds;
    syncPalette(ids);
  };

  return {
    paintings,
    addToCollection,
    removeFromCollection,
    isInCollection,
    toggleSeen,
    toggleWantToVisit,
    getPaintingsByArtist,
    getPaintingsByMuseum,
    palettePaintingIds,
    addToPalette,
    removeFromPalette,
    isPaintingInPalette,
    getPalettePaintings,
    syncing,
    syncError,
  };
}
