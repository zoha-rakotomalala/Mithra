import {
  buildSearchString,
  commonsImageUrls,
  searchPaintings,
  searchWikidataRecords,
} from '@/services/wikidataService';

// museumApi is a ky instance; replace its get() with a router over the
// Wikidata API actions so each test controls both calls.
const mockGet = jest.fn();
jest.mock('@/services/museumApiClient', () => ({
  museumApi: { get: (...arguments_: unknown[]) => mockGet(...arguments_) },
}));

jest.mock('@/services/museumAdapterRegistry', () => ({
  registerAdapter: jest.fn(),
}));

type Parameters_ = Record<string, string>;

/** Shapes recorded from the live API on 2026-10-05 (formatversion=2). */
const item = (id: string) => ({
  mainsnak: { datatype: 'wikibase-item', datavalue: { value: { id } } },
});
const string_ = (value: string) => ({
  mainsnak: { datatype: 'string', datavalue: { value } },
});
const qty = (amount: string, unit = 'Q174728') => ({
  mainsnak: {
    datatype: 'quantity',
    datavalue: {
      value: { amount, unit: `http://www.wikidata.org/entity/${unit}` },
    },
  },
});
const time = (time: string, precision = 9) => ({
  mainsnak: { datatype: 'time', datavalue: { value: { precision, time } } },
});

const nightWatch = {
  claims: {
    P170: [item('Q5598')],
    P18: [string_('La ronda de noche, por Rembrandt van Rijn.jpg')],
    P186: [item('Q12321255'), item('Q296955')],
    P195: [item('Q190804')],
    P2048: [qty('+363')],
    P2049: [qty('+437')],
    P217: [
      {
        ...string_('SK-C-5'),
        qualifiers: { P195: [item('Q190804').mainsnak] },
      },
    ],
    P276: [item('Q3421329')],
    P571: [time('+1642-01-01T00:00:00Z')],
  },
  descriptions: {
    en: { language: 'en', value: '1642 painting by Rembrandt, Rijksmuseum' },
  },
  id: 'Q219831',
  labels: {
    en: { language: 'en', value: 'The Night Watch' },
    fr: { language: 'fr', value: 'La Ronde de nuit' },
  },
};

const liberty = {
  claims: {
    P170: [item('Q33477')],
    P18: [string_('Liberty.jpg')],
    P571: [time('+1830-00-00T00:00:00Z')],
    // Ended loan to the Luxembourg Museum (normal rank, P582), then the
    // current home (preferred). The current one must win.
    P195: [
      {
        ...item('Q1411180'),
        qualifiers: { P582: [time('+1874-01-01T00:00:00Z').mainsnak] },
        rank: 'normal',
      },
      { ...item('Q3044768'), rank: 'preferred' },
    ],
    P217: [
      {
        ...string_('OLD 1'),
        qualifiers: { P195: [item('Q1411180').mainsnak] },
      },
      {
        ...string_('RF 129'),
        qualifiers: { P195: [item('Q3044768').mainsnak] },
      },
    ],
    P9394: [string_('010065872')],
  },
  id: 'Q29530',
  labels: { en: { language: 'en', value: 'Liberty Leading the People' } },
};

const labels: Record<string, string> = {
  Q12321255: 'canvas',
  Q1411180: 'Luxembourg Museum',
  Q190804: 'Rijksmuseum',
  Q296955: 'oil paint',
  Q3044768: 'Department of Paintings of the Louvre',
  Q33477: 'Eugène Delacroix',
  Q3421329: 'Nightwatch hall',
  Q5598: 'Rembrandt',
};

function routeApi(
  searchIds: string[],
  entities: Record<string, unknown>,
  totalhits = searchIds.length,
) {
  mockGet.mockImplementation(
    (_url: string, options: { searchParams: Parameters_ }) => {
      const parameters = options.searchParams;
      let body: unknown;
      if (parameters.action === 'query') {
        body = {
          query: {
            search: searchIds.map((title) => ({ title })),
            searchinfo: { totalhits },
          },
        };
      } else if (parameters.action === 'wbgetentities') {
        const ids = parameters.ids.split('|');
        const out: Record<string, unknown> = {};
        for (const id of ids) {
          out[id] =
            parameters.props === 'labels'
              ? { id, labels: labels[id] ? { en: { value: labels[id] } } : {} }
              : (entities[id] ?? { id, missing: '' });
        }
        body = { entities: out };
      }
      return { json: async () => body };
    },
  );
}

beforeEach(() => {
  mockGet.mockReset();
});

describe('buildSearchString', () => {
  it('always filters on paintings and joins collections with |', () => {
    expect(buildSearchString('  Night Watch ')).toBe(
      'Night Watch haswbstatement:P31=Q3305213',
    );
    expect(buildSearchString('Delacroix', ['Q3044768', 'Q19675'])).toBe(
      'Delacroix haswbstatement:P31=Q3305213 haswbstatement:P195=Q3044768|P195=Q19675',
    );
  });
});

describe('commonsImageUrls', () => {
  it('builds Special:FilePath URLs with a 400px thumbnail', () => {
    const urls = commonsImageUrls('La ronda de noche, por Rembrandt.jpg');
    expect(urls.imageUrl).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/La_ronda_de_noche%2C_por_Rembrandt.jpg',
    );
    expect(urls.thumbnailUrl).toBe(`${urls.imageUrl}?width=400`);
  });
});

describe('searchWikidataRecords', () => {
  it('parses a full record and keeps search-rank order', async () => {
    routeApi(
      ['Q219831', 'Q29530'],
      { Q219831: nightWatch, Q29530: liberty },
      27,
    );

    const result = await searchWikidataRecords({ query: 'Night Watch' });

    expect(result.totalResults).toBe(27);
    expect(result.records.map((r) => r.qid)).toEqual(['Q219831', 'Q29530']);

    const [first] = result.records;
    expect(first.painting).toMatchObject({
      artist: 'Rembrandt',
      description: '1642 painting by Rembrandt, Rijksmuseum',
      dimensions: '363 cm × 437 cm',
      id: 'wikidata-Q219831',
      location: 'Amsterdam, Netherlands',
      medium: 'canvas, oil paint',
      museum: 'Rijksmuseum',
      objectURL: 'https://www.wikidata.org/wiki/Q219831',
      title: 'The Night Watch',
      year: 1642,
    });
    expect(first.painting.thumbnailUrl).toContain('?width=400');
    expect(first.inventoryNumber).toBe('SK-C-5');
  });

  it('sends the collection filter and three requests: search, entities, labels', async () => {
    routeApi(['Q219831'], { Q219831: nightWatch });

    await searchWikidataRecords({ collections: ['Q190804'], query: 'Benares' });

    const actions = mockGet.mock.calls.map(
      (call) => (call[1] as { searchParams: Parameters_ }).searchParams,
    );
    expect(actions[0].srsearch).toBe(
      'Benares haswbstatement:P31=Q3305213 haswbstatement:P195=Q190804',
    );
    expect(actions.map((p) => p.action)).toEqual([
      'query',
      'wbgetentities',
      'wbgetentities',
    ]);
    expect(actions[1].props).toBe('labels|descriptions|claims');
    expect(actions[2].props).toBe('labels');
    // Every request names a contact URL, as Wikimedia's robot policy asks.
    for (const call of mockGet.mock.calls) {
      const headers = (call[1] as { headers: Parameters_ }).headers;
      expect(headers['User-Agent']).toContain('https://github.com/');
    }
  });

  it('credits the current collection, not an ended loan, and its inventory number', async () => {
    routeApi(['Q29530'], { Q29530: liberty });

    const result = await searchWikidataRecords({
      collections: ['Q3044768', 'Q19675'],
      externalIdProperties: ['P9394'],
      idPrefix: 'louvre',
      location: 'Paris, France',
      museum: 'Musée du Louvre',
      query: 'Liberty',
    });

    const [record] = result.records;
    expect(record.painting.id).toBe('louvre-Q29530');
    expect(record.painting.museum).toBe('Musée du Louvre');
    expect(record.painting.location).toBe('Paris, France');
    expect(record.painting.year).toBe(1830);
    expect(record.inventoryNumber).toBe('RF 129');
    expect(record.externalIds).toEqual({ P9394: '010065872' });
  });

  it('falls back through fr and nl labels and drops a record with none', async () => {
    const frOnly = {
      claims: {},
      id: 'Q1',
      labels: { fr: { value: 'Le Pont' } },
    };
    const nlOnly = {
      claims: {},
      id: 'Q2',
      labels: { nl: { value: 'De Brug' } },
    };
    const bare = { claims: {}, id: 'Q3', labels: {} };
    routeApi(['Q1', 'Q2', 'Q3'], { Q1: frOnly, Q2: nlOnly, Q3: bare });

    const result = await searchWikidataRecords({ query: 'pont' });

    expect(result.records.map((r) => r.painting.title)).toEqual([
      'Le Pont',
      'De Brug',
    ]);
    expect(result.records[0].painting.artist).toBe('Unknown Artist');
    expect(result.records[0].painting.imageUrl).toBeUndefined();
  });

  it('converts millimetres and ignores unknown units; decade-precision dates give no year', async () => {
    const odd = {
      claims: {
        P2048: [qty('+1200', 'Q174789')],
        P2049: [qty('+3', 'Q999999')],
        P571: [time('+1640-00-00T00:00:00Z', 8)],
      },
      id: 'Q4',
      labels: { en: { value: 'Odd' } },
    };
    routeApi(['Q4'], { Q4: odd });

    const [record] = (await searchWikidataRecords({ query: 'odd' })).records;

    expect(record.painting.dimensions).toBe('120 cm (height)');
    expect(record.painting.year).toBeUndefined();
  });

  it('batches entity requests in groups of 50', async () => {
    const ids = Array.from({ length: 60 }, (_, index) => `Q${index + 1}`);
    const entities: Record<string, unknown> = {};
    for (const id of ids) {
      entities[id] = {
        claims: {},
        id,
        labels: { en: { value: id.toLowerCase() } },
      };
    }
    routeApi(ids, entities);

    await searchWikidataRecords({ limit: 60, query: 'many' });

    const entityCalls = mockGet.mock.calls
      .map((call) => (call[1] as { searchParams: Parameters_ }).searchParams)
      .filter((p) => p.action === 'wbgetentities');
    expect(entityCalls.map((p) => p.ids.split('|').length)).toEqual([50, 10]);
    // srlimit is capped at the API maximum
    const search = mockGet.mock.calls[0][1] as { searchParams: Parameters_ };
    expect(search.searchParams.srlimit).toBe('50');
  });

  it('returns nothing for an empty query without calling the API', async () => {
    const result = await searchWikidataRecords({ query: '   ' });
    expect(result).toEqual({ records: [], totalResults: 0 });
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('searchPaintings', () => {
  it('returns plain paintings and swallows network errors', async () => {
    routeApi(['Q219831'], { Q219831: nightWatch });
    const ok = await searchPaintings({ query: 'Night Watch' });
    expect(ok.paintings).toHaveLength(1);
    expect(ok.paintings[0].title).toBe('The Night Watch');

    mockGet.mockImplementation(() => {
      throw new Error('429 Too Many Requests');
    });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failed = await searchPaintings({ query: 'Night Watch' });
    expect(failed).toEqual({ paintings: [], totalResults: 0 });
    spy.mockRestore();
  });
});
