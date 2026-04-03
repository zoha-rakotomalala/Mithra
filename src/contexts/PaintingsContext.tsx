/**
 * PaintingsContext — Backward-compatible facade that composes
 * CollectionContext, PaletteContext, and SyncContext.
 *
 * Consumers can continue using `usePaintings()` unchanged.
 * New code should prefer the focused hooks: useCollection, usePalette, useSync.
 */
import type { MMKV } from 'react-native-mmkv';

import React, { useCallback, useRef, useState } from 'react';

import { SyncProvider, useSync } from '@/contexts/SyncContext';
import { CollectionProvider, useCollection } from '@/contexts/CollectionContext';
import { PaletteProvider, usePalette } from '@/contexts/PaletteContext';

type PaintingsProviderProps = {
  readonly children: React.ReactNode;
  readonly storage: MMKV;
};

/**
 * Inner component that wires cross-context behavior
 * (e.g. removeFromCollection also removes from palette)
 */
function PaintingsInner({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}

export function PaintingsProvider({ children, storage }: PaintingsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const collectionRefreshRef = useRef<(() => void) | null>(null);
  const paletteRefreshRef = useRef<(() => void) | null>(null);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleSyncComplete = useCallback(() => {
    collectionRefreshRef.current?.();
    paletteRefreshRef.current?.();
  }, []);

  return (
    <SyncProvider storage={storage} isLoaded={isLoaded} onSyncComplete={handleSyncComplete}>
      <CollectionProvider storage={storage} onLoaded={handleLoaded}>
        <PaletteProvider storage={storage}>
          <RefCapture
            collectionRefreshRef={collectionRefreshRef}
            paletteRefreshRef={paletteRefreshRef}
          >
            <PaintingsInner>{children}</PaintingsInner>
          </RefCapture>
        </PaletteProvider>
      </CollectionProvider>
    </SyncProvider>
  );
}

/**
 * Captures _refreshFromStorage refs from child contexts so the
 * sync-complete callback can trigger them.
 */
function RefCapture({
  children,
  collectionRefreshRef,
  paletteRefreshRef,
}: {
  readonly children: React.ReactNode;
  collectionRefreshRef: React.MutableRefObject<(() => void) | null>;
  paletteRefreshRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { _refreshFromStorage: refreshCollection } = useCollection();
  const { _refreshFromStorage: refreshPalette } = usePalette();

  collectionRefreshRef.current = refreshCollection;
  paletteRefreshRef.current = refreshPalette;

  return <>{children}</>;
}

/**
 * Facade hook — backward compatible with the original API.
 * Combines all three focused contexts into a single object.
 */
export function usePaintings() {
  const collection = useCollection();
  const palette = usePalette();
  const sync = useSync();

  // Preserve original behavior: removeFromCollection also removes from palette
  const removeFromCollection = useCallback((paintingId: string) => {
    collection.removeFromCollection(paintingId);
    palette.removeFromPalette(paintingId);
  }, [collection.removeFromCollection, palette.removeFromPalette]);

  return {
    // Collection
    paintings: collection.paintings,
    addToCollection: collection.addToCollection,
    removeFromCollection,
    isInCollection: collection.isInCollection,
    toggleSeen: collection.toggleSeen,
    toggleWantToVisit: collection.toggleWantToVisit,
    getPaintingsByArtist: collection.getPaintingsByArtist,
    getPaintingsByMuseum: collection.getPaintingsByMuseum,

    // Palette
    palettePaintingIds: palette.palettePaintingIds,
    addToPalette: palette.addToPalette,
    removeFromPalette: palette.removeFromPalette,
    isPaintingInPalette: palette.isPaintingInPalette,
    getPalettePaintings: palette.getPalettePaintings,

    // Sync
    syncing: sync.syncing,
    syncError: sync.syncError,
  };
}
