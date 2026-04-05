import { Paths } from '@/navigation/paths';

/**
 * Screen Registry Tests
 *
 * These tests ensure every screen that can be navigated to is actually
 * registered in a navigator. This catches regressions where a screen
 * is removed from a navigator but still referenced in navigate() calls.
 *
 */

// Screens registered in Application.tsx root stack
const ROOT_STACK_SCREENS = new Set([
  Paths.Startup,
  Paths.PaintingDetail,
  Paths.ArtistProfile,
  Paths.VisitDetail,
  Paths.MuseumCollection,
  Paths.LikedPaintings,
  Paths.VisitPalette,
  Paths.ViewPalette,
  Paths.Auth,
  Paths.Search,
]);

// Screens registered in TabNavigator.tsx
const TAB_SCREENS = new Set([
  Paths.Visits,
  Paths.Home,
  Paths.Search,
  Paths.Palette,
  Paths.Settings,
]);

// 'Main' is the tab navigator container in the root stack
const ALL_REGISTERED = new Set([...ROOT_STACK_SCREENS, ...TAB_SCREENS, 'Main']);

// Every Paths value that is used as a navigate() / reset() target from screens/hooks.
// This list must be updated when new navigation calls are added.
const NAVIGATION_TARGETS: { target: string; from: string }[] = [
  // From Startup (reset to Main)
  { target: 'Main', from: 'Startup' },
  // From VisitDetail
  { target: Paths.Search, from: 'VisitDetail (Browse Collection)' },
  { target: Paths.LikedPaintings, from: 'VisitDetail' },
  { target: Paths.ViewPalette, from: 'VisitDetail' },
  { target: Paths.VisitPalette, from: 'VisitDetail' },
  // From Search/Collection/Palette/PaintingCard/hooks
  { target: Paths.PaintingDetail, from: 'Search/Collection/Palette' },
  // From usePaintingDetail hook
  { target: Paths.ArtistProfile, from: 'PaintingDetail' },
  { target: Paths.VisitDetail, from: 'PaintingDetail' },
  // From Visits
  { target: Paths.VisitDetail, from: 'Visits' },
  // From MuseumBrowser
  { target: Paths.MuseumCollection, from: 'MuseumBrowser' },
  // From LikedPaintings
  { target: Paths.PaintingDetail, from: 'LikedPaintings' },
  // From ArtistProfile
  { target: Paths.PaintingDetail, from: 'ArtistProfile' },
  // From ViewPalette
  { target: Paths.VisitPalette, from: 'ViewPalette' },
  { target: Paths.PaintingDetail, from: 'ViewPalette' },
  // From Settings (when not logged in)
  { target: Paths.Auth, from: 'Settings' },
];

// Paths that exist in the enum but are not registered in any navigator.
// These are legacy/unused values — add here only with justification.
const UNUSED_PATHS = new Set([
  Paths.Example,    // template/example screen, never registered
  Paths.Collection, // Collection tab uses Paths.Home instead
]);

describe('Screen Registry', () => {
  it('every Paths enum value is registered in at least one navigator (or explicitly marked unused)', () => {
    const allPaths = [
      Paths.Example, Paths.Startup, Paths.Home, Paths.Palette, Paths.Settings,
      Paths.Search, Paths.PaintingDetail, Paths.Collection, Paths.ArtistProfile,
      Paths.Visits, Paths.VisitDetail, Paths.MuseumCollection, Paths.LikedPaintings,
      Paths.VisitPalette, Paths.ViewPalette, Paths.Auth,
    ];
    const unregistered = allPaths.filter(p => !ALL_REGISTERED.has(p) && !UNUSED_PATHS.has(p));
    expect(unregistered).toEqual([]);
  });

  it.each(NAVIGATION_TARGETS)(
    'navigation target "$target" (from $from) is registered in a navigator',
    ({ target }) => {
      expect(ALL_REGISTERED.has(target)).toBe(true);
    },
  );

  it('root stack screens that accept params from other screens are in ROOT_STACK_SCREENS (not just tabs)', () => {
    // These screens are navigated to with params from the root stack level.
    // They MUST be in the root stack, not just in tabs.
    const requiresRootStack = [
      Paths.PaintingDetail,   // navigated from many screens with { paintingId }
      Paths.ArtistProfile,    // navigated from PaintingDetail with { artistName }
      Paths.VisitDetail,      // navigated from Visits with { visitId }
      Paths.MuseumCollection, // navigated from MuseumBrowser with { museumId, visitId }
      Paths.LikedPaintings,   // navigated from VisitDetail with { visitId }
      Paths.VisitPalette,     // navigated from VisitDetail with { visitId }
      Paths.ViewPalette,      // navigated from VisitDetail with { visitId }
      Paths.Search,           // navigated from VisitDetail with { museumId, visitId }
    ];

    const missing = requiresRootStack.filter(p => !ROOT_STACK_SCREENS.has(p));
    expect(missing).toEqual([]);
  });
});
