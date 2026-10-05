import type { WikidataRecord } from '@/services/wikidataService';

import { searchLouvre } from '@/services/louvreService';

const mockSearchWikidataRecords = jest.fn();
jest.mock('@/services/wikidataService', () => ({
  searchWikidataRecords: (...arguments_: unknown[]) =>
    mockSearchWikidataRecords(...arguments_),
}));

const mockGet = jest.fn();
jest.mock('@/services/museumApiClient', () => ({
  museumApi: { get: (...arguments_: unknown[]) => mockGet(...arguments_) },
}));

jest.mock('@/services/museumAdapterRegistry', () => ({
  registerAdapter: jest.fn(),
}));

const record = (
  qid: string,
  title: string,
  extra: Partial<WikidataRecord> = {},
): WikidataRecord => ({
  externalIds: {},
  painting: {
    artist: 'Eugène Delacroix',
    color: '#000000',
    id: `louvre-${qid}`,
    imageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${qid}.jpg`,
    isSeen: false,
    location: 'Paris, France',
    museum: 'Musée du Louvre',
    objectURL: `https://www.wikidata.org/wiki/${qid}`,
    thumbnailUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${qid}.jpg?width=400`,
    title,
    wantToVisit: false,
  },
  qid,
  ...extra,
});

beforeEach(() => {
  mockSearchWikidataRecords.mockReset();
  mockGet.mockReset();
});

describe('searchLouvre', () => {
  it('searches Wikidata inside the Louvre collections and asks for the ark id', async () => {
    mockSearchWikidataRecords.mockResolvedValue({
      records: [],
      totalResults: 0,
    });

    await searchLouvre({ limit: 8, query: 'Delacroix' });

    expect(mockSearchWikidataRecords).toHaveBeenCalledWith({
      collections: ['Q3044768', 'Q19675'],
      externalIdProperties: ['P9394'],
      idPrefix: 'louvre',
      limit: 8,
      location: 'Paris, France',
      museum: 'Musée du Louvre',
      query: 'Delacroix',
    });
  });

  it('enriches a record with an ark id from the Louvre JSON and keeps the ark-based id', async () => {
    mockSearchWikidataRecords.mockResolvedValue({
      records: [
        record('Q29530', 'Liberty Leading the People', {
          externalIds: { P9394: '010065872' },
        }),
        record('Q1626128', 'Homage to Delacroix'),
      ],
      totalResults: 75,
    });
    mockGet.mockReturnValue({
      json: async () => ({
        image: [
          {
            urlImage: 'https://collections.louvre.fr/media/large.jpg',
            urlThumbnail: 'https://collections.louvre.fr/media/small.jpg',
          },
        ],
        url: 'https://collections.louvre.fr/ark:/53355/cl010065872',
      }),
    });

    const result = await searchLouvre({ query: 'Delacroix' });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      'https://collections.louvre.fr/ark:/53355/cl010065872.json',
    );
    expect(result.totalResults).toBe(75);
    expect(result.paintings[0]).toMatchObject({
      id: 'louvre-010065872',
      imageUrl: 'https://collections.louvre.fr/media/large.jpg',
      objectURL: 'https://collections.louvre.fr/ark:/53355/cl010065872',
      thumbnailUrl: 'https://collections.louvre.fr/media/small.jpg',
    });
    // No ark id: Wikidata's own data stands, untouched.
    expect(result.paintings[1]).toMatchObject({
      id: 'louvre-Q1626128',
      imageUrl:
        'https://commons.wikimedia.org/wiki/Special:FilePath/Q1626128.jpg',
      objectURL: 'https://www.wikidata.org/wiki/Q1626128',
    });
  });

  it('falls back to the Wikidata image when the Louvre JSON fails, and drops imageless paintings', async () => {
    const noImage = record('Q3', 'No photo');
    noImage.painting.imageUrl = undefined;
    noImage.painting.thumbnailUrl = undefined;
    mockSearchWikidataRecords.mockResolvedValue({
      records: [
        record('Q29530', 'Liberty', { externalIds: { P9394: '010065872' } }),
        noImage,
      ],
      totalResults: 2,
    });
    mockGet.mockImplementation(() => {
      throw new Error('503');
    });

    const result = await searchLouvre({ query: 'Liberty' });

    expect(result.paintings).toHaveLength(1);
    expect(result.paintings[0].id).toBe('louvre-010065872');
    expect(result.paintings[0].imageUrl).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/Q29530.jpg',
    );
  });

  it('returns an empty result when the Wikidata search throws', async () => {
    mockSearchWikidataRecords.mockRejectedValue(new Error('429'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await searchLouvre({ query: 'Delacroix' });

    expect(result).toEqual({ paintings: [], totalResults: 0 });
    spy.mockRestore();
  });
});
