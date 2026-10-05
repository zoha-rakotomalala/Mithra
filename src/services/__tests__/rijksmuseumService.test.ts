import { searchRijksmuseum } from '@/services/rijksmuseumService';

const mockGet = jest.fn();
jest.mock('@/services/museumApiClient', () => ({
  museumApi: { get: (...args: unknown[]) => mockGet(...args) },
}));

jest.mock('@/services/museumAdapterRegistry', () => ({
  registerAdapter: jest.fn(),
}));

/** Minimal Linked Art record the parser accepts (shape as served 2026-10-03). */
const linkedArt = (id: string, title: string) => ({
  id,
  type: 'HumanMadeObject',
  identified_by: [
    {
      type: 'Name',
      content: title,
      language: [{ id: 'http://vocab.getty.edu/aat/300388277' }],
      classified_as: [{ id: 'http://vocab.getty.edu/aat/300404670' }],
    },
  ],
  representation: [
    {
      type: 'VisualItem',
      digitally_shown_by: [
        {
          type: 'DigitalObject',
          access_point: [{ id: `https://img/${title}.jpg` }],
        },
      ],
    },
  ],
});

const searchResponse = (ids: string[], total = ids.length) => ({
  orderedItems: ids.map((id) => ({ id })),
  partOf: { totalItems: total },
});

beforeEach(() => {
  mockGet.mockReset();
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe("searchRijksmuseum with searchType 'any'", () => {
  it('queries the creator and the title indexes and interleaves the ids, creator first', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('creator=')) {
        return {
          json: async () =>
            searchResponse(['https://o/a1', 'https://o/a2'], 24),
        };
      }
      if (url.includes('title=')) {
        return {
          json: async () =>
            searchResponse(['https://o/t1', 'https://o/a1', 'https://o/t2'], 3),
        };
      }
      const name = url.split('/').pop() ?? '';
      return { json: async () => linkedArt(url, name) };
    });

    const result = await searchRijksmuseum({
      query: 'Rembrandt',
      searchType: 'any',
      limit: 10,
    });

    const searchUrls = mockGet.mock.calls
      .map((c) => c[0] as string)
      .filter((u) => u.includes('type=painting'));
    expect(searchUrls).toHaveLength(2);
    expect(searchUrls[0]).toContain('creator=Rembrandt');
    expect(searchUrls[1]).toContain('title=Rembrandt');

    // a1 appears in both indexes once; order is creator, title, creator, title...
    expect(result.paintings.map((p) => p.title)).toEqual([
      'a1',
      't1',
      'a2',
      't2',
    ]);
    expect(result.totalResults).toBe(24);
  });

  it("queries one index for 'artist' and honours the limit", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('type=painting')) {
        return {
          json: async () =>
            searchResponse(['https://o/a1', 'https://o/a2', 'https://o/a3']),
        };
      }
      const name = url.split('/').pop() ?? '';
      return { json: async () => linkedArt(url, name) };
    });

    const result = await searchRijksmuseum({
      query: 'Vermeer',
      searchType: 'artist',
      limit: 2,
    });

    const searchUrls = mockGet.mock.calls
      .map((c) => c[0] as string)
      .filter((u) => u.includes('type=painting'));
    expect(searchUrls).toHaveLength(1);
    expect(result.paintings).toHaveLength(2);
  });
});
