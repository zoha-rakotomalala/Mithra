import type { WikidataRecord } from '@/services/wikidataService';

import { searchOrsay } from '@/services/orsayService';

const mockSearchWikidataRecords = jest.fn();
jest.mock('@/services/wikidataService', () => ({
  searchWikidataRecords: (...arguments_: unknown[]) =>
    mockSearchWikidataRecords(...arguments_),
}));

jest.mock('@/services/museumAdapterRegistry', () => ({
  registerAdapter: jest.fn(),
}));

const record = (
  qid: string,
  title: string,
  externalIds: Record<string, string> = {},
): WikidataRecord => ({
  externalIds,
  painting: {
    artist: 'Vincent van Gogh',
    color: '#000000',
    id: `orsay-${qid}`,
    isSeen: false,
    location: 'Paris, France',
    museum: "Musée d'Orsay",
    objectURL: `https://www.wikidata.org/wiki/${qid}`,
    title,
    wantToVisit: false,
  },
  qid,
});

beforeEach(() => mockSearchWikidataRecords.mockReset());

describe('searchOrsay', () => {
  it('searches Wikidata inside the Orsay collection and asks for the artwork id', async () => {
    mockSearchWikidataRecords.mockResolvedValue({
      records: [],
      totalResults: 0,
    });

    await searchOrsay({ limit: 5, query: 'Van Gogh' });

    expect(mockSearchWikidataRecords).toHaveBeenCalledWith({
      collections: ['Q23402'],
      externalIdProperties: ['P4659'],
      idPrefix: 'orsay',
      limit: 5,
      location: 'Paris, France',
      museum: "Musée d'Orsay",
      query: 'Van Gogh',
    });
  });

  it('links to the museum page when an artwork id exists, else keeps the Wikidata link', async () => {
    mockSearchWikidataRecords.mockResolvedValue({
      records: [
        record('Q1464531', 'Starry Night Over the Rhone', { P4659: '78696' }),
        record('Q99', 'No id'),
      ],
      totalResults: 2,
    });

    const result = await searchOrsay({ query: 'Van Gogh' });

    expect(result.paintings[0].objectURL).toBe(
      'https://www.musee-orsay.fr/fr/oeuvres/78696',
    );
    expect(result.paintings[1].objectURL).toBe(
      'https://www.wikidata.org/wiki/Q99',
    );
  });

  it('returns an empty result when the search throws', async () => {
    mockSearchWikidataRecords.mockRejectedValue(new Error('429'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await searchOrsay({ query: 'x' })).toEqual({
      paintings: [],
      totalResults: 0,
    });
    spy.mockRestore();
  });
});
