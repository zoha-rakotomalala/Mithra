import type { Painting } from '@/types/painting';

// Adapter modules register themselves on import and pull in the network
// client; replace the registry with one fake adapter instead.
const mockSearch = jest.fn();
jest.mock('@/services/museumAdapterRegistry', () => ({
  getAdapter: (museumId: string) =>
    museumId === 'FAKE' ? { museumId, search: mockSearch } : undefined,
  registerAdapter: jest.fn(),
}));
jest.mock('@/services/metMuseumService', () => ({}));
jest.mock('@/services/rijksmuseumService', () => ({}));
jest.mock('@/services/clevelandService', () => ({}));
jest.mock('@/services/chicagoService', () => ({}));
jest.mock('@/services/harvardService', () => ({}));
jest.mock('@/services/vaService', () => ({}));
jest.mock('@/services/europeanaService', () => ({}));
jest.mock('@/services/parisMuseumsService', () => ({}));
jest.mock('@/services/nationalGalleryService', () => ({}));
jest.mock('@/services/jocondeService', () => ({}));
jest.mock('@/services/wikidataService', () => ({}));
jest.mock('@/services/smkService', () => ({}));
jest.mock('@/services/smithsonianService', () => ({}));
jest.mock('@/services/louvreService', () => ({}));

const mockGetCached = jest.fn();
const mockGetFreshness = jest.fn();
const mockUpdateCache = jest.fn();
jest.mock('@/services/paintingCacheService', () => ({
  getCachedPaintings: (...a: unknown[]) => mockGetCached(...a),
  getCacheFreshness: (...a: unknown[]) => mockGetFreshness(...a),
  updateCacheWithFreshResults: (...a: unknown[]) => mockUpdateCache(...a),
}));

import { searchAllMuseums } from '@/services/unifiedMuseumService';

const painting: Painting = {
  id: 'fake-1',
  title: 'The Night Watch',
  artist: 'Rembrandt van Rijn',
  color: '#000',
  imageUrl: 'https://img.example.com/1.jpg',
  medium: 'oil on canvas',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  mockSearch.mockResolvedValue({ paintings: [painting], totalResults: 1 });
  mockUpdateCache.mockResolvedValue({
    added: 1,
    updated: 0,
    legacyToUuid: {},
  });
});

describe('searchAllMuseums cache resilience', () => {
  it('returns API results when the cache read throws', async () => {
    mockGetCached.mockRejectedValue(new Error('supabase down'));

    const result = await searchAllMuseums({
      query: 'Night Watch',
      searchType: 'title',
      museumIds: ['FAKE'],
    });

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(result.paintings.map((p) => p.title)).toEqual(['The Night Watch']);
    expect(result.cacheStats.misses).toBe(1);
  });

  it('keeps API results when the cache write throws', async () => {
    mockGetCached.mockResolvedValue([]);
    mockUpdateCache.mockRejectedValue(new Error('write failed'));

    const result = await searchAllMuseums({
      query: 'Night Watch',
      searchType: 'title',
      museumIds: ['FAKE'],
    });

    expect(result.paintings).toHaveLength(1);
    expect((result.paintings[0] as any).sourceMuseumId).toBe('FAKE');
  });

  it('keeps anonymous paintings by default', async () => {
    mockGetCached.mockResolvedValue([]);
    mockSearch.mockResolvedValue({
      paintings: [{ ...painting, artist: 'Unknown Artist' }],
      totalResults: 1,
    });

    const result = await searchAllMuseums({
      query: 'Night Watch',
      searchType: 'title',
      museumIds: ['FAKE'],
    });

    expect(result.paintings).toHaveLength(1);
  });
});
