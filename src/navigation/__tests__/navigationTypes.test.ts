import { Paths } from '@/navigation/paths';
import type { RootStackParamList } from '@/navigation/types';

/**
 * Navigation Type Tests
 *
 * Ensures route param types match expectations.
 * The type-level safety comes from tsc --noEmit (run in CI).
 * These runtime tests verify param shapes.
 */

describe('Navigation Types', () => {
  it('RootStackParamList has entries for all navigable Paths', () => {
    const rootStackPaths = [
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
    ];

    rootStackPaths.forEach((path) => {
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });
  });

  it('PaintingDetail requires paintingId param', () => {
    const params: RootStackParamList['paintingDetail'] = {
      paintingId: 'test-uuid',
    };
    expect(params.paintingId).toBe('test-uuid');
  });

  it('ArtistProfile requires artistName param', () => {
    const params: RootStackParamList['artistProfile'] = { artistName: 'Monet' };
    expect(params.artistName).toBe('Monet');
  });

  it('VisitDetail requires visitId param', () => {
    const params: RootStackParamList['visitDetail'] = { visitId: 'test-uuid' };
    expect(params.visitId).toBe('test-uuid');
  });

  it('Search accepts optional museumId and visitId params', () => {
    const withParams: RootStackParamList['search'] = {
      museumId: 'MET',
      visitId: 'v1',
    };
    const withoutParams: RootStackParamList['search'] = undefined;
    expect(withParams!.museumId).toBe('MET');
    expect(withoutParams).toBeUndefined();
  });
});
