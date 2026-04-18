import {
  getAllMuseums,
  getMuseumById,
  getMuseumsByTier,
} from '../museumRegistry';

describe('museumRegistry', () => {
  describe('getAllMuseums', () => {
    it('returns all registered museums', () => {
      const museums = getAllMuseums();
      expect(museums.length).toBeGreaterThanOrEqual(14);
    });

    it('every museum has required fields', () => {
      getAllMuseums().forEach((museum) => {
        expect(museum).toHaveProperty('id');
        expect(museum).toHaveProperty('name');
        expect(museum).toHaveProperty('shortName');
        expect(museum).toHaveProperty('color');
        expect([1, 2, 3]).toContain(museum.tier);
      });
    });

    it('has no duplicate museum IDs', () => {
      const ids = getAllMuseums().map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getMuseumById', () => {
    it('returns museum for valid ID', () => {
      const met = getMuseumById('MET');
      expect(met).toBeDefined();
      expect(met!.name).toContain('Metropolitan');
    });

    it('returns undefined for invalid ID', () => {
      expect(getMuseumById('NONEXISTENT')).toBeUndefined();
    });
  });

  describe('getMuseumsByTier', () => {
    it('tier 1 contains the major museums', () => {
      const ids = getMuseumsByTier(1).map((m) => m.id);
      expect(ids).toContain('MET');
      expect(ids).toContain('RIJKS');
      expect(ids).toContain('CHICAGO');
      expect(ids).toContain('CLEVELAND');
    });

    it('each tier returns only museums of that tier', () => {
      ([1, 2, 3] as const).forEach((tier) => {
        getMuseumsByTier(tier).forEach((m) => expect(m.tier).toBe(tier));
      });
    });

    it('all museums are covered across all tiers', () => {
      const fromTiers = [
        ...getMuseumsByTier(1),
        ...getMuseumsByTier(2),
        ...getMuseumsByTier(3),
      ];
      expect(fromTiers.length).toBe(getAllMuseums().length);
    });
  });
});
