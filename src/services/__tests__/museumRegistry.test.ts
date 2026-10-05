import {
  DEFAULT_MUSEUMS,
  getAllMuseums,
  getMuseumById,
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

  describe('default scope and order', () => {
    it('defaults to Wikidata, the catalog that covers every museum', () => {
      expect(DEFAULT_MUSEUMS).toEqual(['WIKIDATA']);
      expect(getMuseumById('WIKIDATA')?.enabled).toBe(true);
    });

    it('lists Wikidata first, then the rest alphabetically', () => {
      const names = getAllMuseums().map((m) => m.name);
      expect(getAllMuseums()[0].id).toBe('WIKIDATA');
      const rest = names.slice(1);
      expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
    });
  });
});
