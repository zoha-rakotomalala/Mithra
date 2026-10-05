import type { Painting } from '@/types/painting';

import { generateColorFromString } from '@/utils/colorGenerator';

import { museumApi } from './museumApiClient';

/**
 * Wikidata adapter on the plain MediaWiki API.
 *
 * Two calls instead of one SPARQL query:
 *   1. `list=search` with `haswbstatement:` filters: full-text, ranked, ~0.3 s.
 *   2. `wbgetentities` in batches of 50 for labels, descriptions and claims,
 *      then one more batch for the labels of referenced items (painter,
 *      museum, material).
 *
 * query.wikidata.org (SPARQL) is the part that spiked to 4 s, throttled with
 * 429 and timed out at 20 s. The data is the same; the route was the problem.
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_FILE_PATH =
  'https://commons.wikimedia.org/wiki/Special:FilePath/';

/** Q-id of "painting", the P31 value every record must carry. */
const PAINTING_CLASS = 'Q3305213';

/** Wikidata caps `srlimit` and `wbgetentities` ids at 50 for anonymous clients. */
const MAX_BATCH = 50;

/** Wikidata time precision codes: 7 century, 8 decade, 9 year. */
const DECADE_PRECISION = 8;

/** Label languages, in order of preference. A record with none is dropped. */
const LANGUAGES = ['en', 'fr', 'nl'];

const HEADERS = {
  Accept: 'application/json',
  // Wikimedia's robot policy asks for a contact URL; without one requests
  // fall in the throttled class.
  'User-Agent':
    'PaletteApp/1.0 (https://github.com/zoha-rakotomalala/palette; art collection mobile app)',
};

const PROP = {
  collection: 'P195',
  creator: 'P170',
  endTime: 'P582',
  height: 'P2048',
  image: 'P18',
  inception: 'P571',
  inventoryNumber: 'P217',
  location: 'P276',
  material: 'P186',
  width: 'P2049',
} as const;

/** Length units Wikidata uses on paintings, as a factor to centimetres. */
const CM_PER_UNIT: Record<string, number> = {
  Q11573: 100, // metre
  Q174728: 1, // centimetre
  Q174789: 0.1, // millimetre
  Q218593: 2.54, // inch
};

export type WikidataRecord = {
  externalIds: Record<string, string>;
  inventoryNumber?: string;
  painting: Painting;
  qid: string;
};

export type WikidataRecordSearchResult = {
  records: WikidataRecord[];
  totalResults: number;
};

export type WikidataSearchParams = {
  limit?: number;
  query: string;
  /**
   * Wikidata ids of collections (P195) to search inside, e.g. `['Q190804']`
   * for the Rijksmuseum. Empty means every museum. The filter turns a list of
   * homonyms into the one painting that hangs where the user stands.
   */
  collections?: string[];
  /** Museum name to stamp on every result; defaults to the P195 label. */
  museum?: string;
  /** Location to stamp on every result; defaults to P276 or a known-museum map. */
  location?: string;
  /** Prefix of the painting id; defaults to `wikidata`. */
  idPrefix?: string;
  /**
   * External-id properties to read off each record (e.g. `P9394` for the
   * Louvre ark id) so a museum adapter can enrich from its own API.
   */
  externalIdProperties?: string[];
};

export type WikidataSearchResult = {
  paintings: Painting[];
  totalResults: number;
};

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function apiGet<T>(
  parameters: Record<string, number | string>,
): Promise<T> {
  const searchParameters: Record<string, string> = {
    format: 'json',
    formatversion: '2',
  };
  for (const [key, value] of Object.entries(parameters)) {
    searchParameters[key] = String(value);
  }
  return museumApi
    .get(WIKIDATA_API, { headers: HEADERS, searchParams: searchParameters })
    .json<T>();
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

/** Build the `srsearch` string: free text plus the painting and collection filters. */
type Claim = {
  mainsnak?: {
    datatype?: string;
    datavalue?: { value?: unknown };
  };
  qualifiers?: Record<string, Claim['mainsnak'][]>;
  rank?: 'deprecated' | 'normal' | 'preferred';
};

type EntitiesResponse = { entities?: Record<string, Entity> };

type Entity = {
  claims?: Record<string, Claim[]>;
  descriptions?: Record<string, { value: string }>;
  id: string;
  labels?: Record<string, { value: string }>;
};

type SearchResponse = {
  query?: {
    search?: { title: string }[];
    searchinfo?: { totalhits?: number };
  };
};

export function buildSearchString(
  query: string,
  collections: string[] = [],
): string {
  const parts = [query.trim(), `haswbstatement:P31=${PAINTING_CLASS}`];
  if (collections.length > 0) {
    parts.push(
      `haswbstatement:${collections.map((q) => `${PROP.collection}=${q}`).join('|')}`,
    );
  }
  return parts.join(' ');
}

async function fetchEntities(
  ids: string[],
  props: string,
): Promise<Record<string, Entity>> {
  const batches = await Promise.all(
    chunk(ids, MAX_BATCH).map((batch) =>
      apiGet<EntitiesResponse>({
        action: 'wbgetentities',
        ids: batch.join('|'),
        languages: LANGUAGES.join('|'),
        props,
      }),
    ),
  );
  const entities: Record<string, Entity> = {};
  for (const batch of batches) {
    Object.assign(entities, batch.entities ?? {});
  }
  return entities;
}

async function searchIds(
  query: string,
  collections: string[],
  limit: number,
): Promise<{ ids: string[]; totalHits: number }> {
  const data = await apiGet<SearchResponse>({
    action: 'query',
    list: 'search',
    srlimit: Math.min(Math.max(limit, 1), MAX_BATCH),
    srprop: '',
    srsearch: buildSearchString(query, collections),
  });
  const hits = data.query?.search ?? [];
  return {
    ids: hits.map((hit) => hit.title).filter((id) => /^Q\d+$/.test(id)),
    totalHits: data.query?.searchinfo?.totalhits ?? hits.length,
  };
}

// ---------------------------------------------------------------------------
// Claim readers
// ---------------------------------------------------------------------------

/**
 * Claims worth reading: not deprecated; the preferred ones when any are
 * preferred; and for `current` properties (collection, location) those
 * without an end time when any is still open.
 */
function claimValue(claim: Claim | undefined): unknown {
  return claim?.mainsnak?.datavalue?.value;
}

function itemId(claim: Claim | undefined): string | undefined {
  const value = claimValue(claim) as { id?: string } | undefined;
  return typeof value?.id === 'string' ? value.id : undefined;
}

function liveClaims(claims: Claim[] | undefined, current = false): Claim[] {
  const kept = (claims ?? []).filter((c) => c.rank !== 'deprecated');
  const preferred = kept.filter((c) => c.rank === 'preferred');
  const pool = preferred.length > 0 ? preferred : kept;
  if (!current) return pool;
  const open = pool.filter((c) => !c.qualifiers?.[PROP.endTime]);
  return open.length > 0 ? open : pool;
}

function stringValue(claim: Claim | undefined): string | undefined {
  const value = claimValue(claim);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Year of an inception claim. Wikidata files circa dates at decade precision
 * (the Mona Lisa: 1503, precision 8), so a decade is accepted and the stated
 * year is used; a century or coarser gives no year.
 */
function yearValue(claim: Claim | undefined): number | undefined {
  const value = claimValue(claim) as
    | { precision?: number; time?: string }
    | undefined;
  if (!value?.time || (value.precision ?? 0) < DECADE_PRECISION)
    return undefined;
  const match = /^([+-]?\d+)-/.exec(value.time);
  if (!match) return undefined;
  const year = Number.parseInt(match[1], 10);
  return Number.isNaN(year) ? undefined : year;
}

/** Length in centimetres, or undefined when the unit is not a known length. */
function centimetres(claim: Claim | undefined): number | undefined {
  const value = claimValue(claim) as
    | { amount?: string; unit?: string }
    | undefined;
  if (!value?.amount) return undefined;
  const unitId = value.unit?.match(/Q\d+$/)?.[0] ?? '';
  const factor = CM_PER_UNIT[unitId];
  if (factor === undefined) return undefined;
  const amount = Number.parseFloat(value.amount);
  if (Number.isNaN(amount)) return undefined;
  return Math.round(amount * factor * 10) / 10;
}

function formatDimensions(
  height: number | undefined,
  width: number | undefined,
): string | undefined {
  if (height !== undefined && width !== undefined) {
    return `${height} cm × ${width} cm`;
  }
  if (height !== undefined) return `${height} cm (height)`;
  if (width !== undefined) return `${width} cm (width)`;
  return undefined;
}

/** First label in the preferred languages, then any language at all. */
function pickLabel(
  labels: Record<string, { value: string }> | undefined,
): string | undefined {
  if (!labels) return undefined;
  for (const lang of LANGUAGES) {
    if (labels[lang]?.value) return labels[lang].value;
  }
  return Object.values(labels)[0]?.value;
}

/** Full-size and 400 px URLs for a Commons file name such as `Night Watch.jpg`. */
export function commonsImageUrls(fileName: string): {
  imageUrl: string;
  thumbnailUrl: string;
} {
  const encoded = encodeURIComponent(fileName.replaceAll(' ', '_'));
  return {
    imageUrl: `${COMMONS_FILE_PATH}${encoded}`,
    thumbnailUrl: `${COMMONS_FILE_PATH}${encoded}?width=400`,
  };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

type ParseContext = {
  collections: string[];
  externalIdProperties: string[];
  idPrefix: string;
  labelOf: (id: string | undefined) => string | undefined;
  location?: string;
  museum?: string;
};

/**
 * The collection claim to credit: one of the requested collections when a
 * filter is set, otherwise the current (not ended, not deprecated) one.
 */
function pickCollection(
  claims: Claim[] | undefined,
  collections: string[],
): Claim | undefined {
  const live = liveClaims(claims, true);
  if (collections.length > 0) {
    const inFilter = (claims ?? []).find((c) => {
      const id = itemId(c);
      return id !== undefined && collections.includes(id);
    });
    if (inFilter) return inFilter;
  }
  return live[0];
}

/** The inventory number issued by the credited collection, else the first. */
function pickInventoryNumber(
  claims: Claim[] | undefined,
  collectionId: string | undefined,
): string | undefined {
  const live = liveClaims(claims);
  if (collectionId) {
    const match = live.find((c) =>
      (c.qualifiers?.[PROP.collection] ?? []).some(
        (q) =>
          (q?.datavalue?.value as { id?: string } | undefined)?.id ===
          collectionId,
      ),
    );
    if (match) return stringValue(match);
  }
  return stringValue(live[0]);
}

/** Ids of every item this record points at, so their labels can be fetched. */
function parseEntity(
  entity: Entity,
  context: ParseContext,
): undefined | WikidataRecord {
  const title = pickLabel(entity.labels);
  if (!title) return undefined; // nothing readable: a bare Q-id is not a result

  const claims = entity.claims ?? {};

  const artists = liveClaims(claims[PROP.creator])
    .map((c) => context.labelOf(itemId(c)))
    .filter(Boolean);

  const collectionClaim = pickCollection(
    claims[PROP.collection],
    context.collections,
  );
  const collectionId = itemId(collectionClaim);
  const museum = context.museum ?? context.labelOf(collectionId);

  // P276 on a painting is often a room ("Nightwatch hall") or the museum
  // itself, so a known city wins; the raw label is the fallback.
  const locationLabel = context.labelOf(
    itemId(liveClaims(claims[PROP.location], true)[0]),
  );
  const location =
    context.location ??
    (museum ? inferLocationFromMuseum(museum) : undefined) ??
    (locationLabel === museum ? undefined : locationLabel);

  const imageFile = stringValue(liveClaims(claims[PROP.image])[0]);
  const image = imageFile ? commonsImageUrls(imageFile) : undefined;

  const materials = liveClaims(claims[PROP.material])
    .map((c) => context.labelOf(itemId(c)))
    .filter(Boolean);

  const externalIds: Record<string, string> = {};
  for (const property of context.externalIdProperties) {
    const value = stringValue(liveClaims(claims[property])[0]);
    if (value) externalIds[property] = value;
  }

  const painting: Painting = {
    artist: artists.length > 0 ? artists.join(', ') : 'Unknown Artist',
    color: generateColorFromString(title),
    description: pickLabel(entity.descriptions),
    dimensions: formatDimensions(
      centimetres(liveClaims(claims[PROP.height])[0]),
      centimetres(liveClaims(claims[PROP.width])[0]),
    ),
    id: `${context.idPrefix}-${entity.id}`,
    imageUrl: image?.imageUrl,
    isSeen: false,
    location,
    medium: materials.length > 0 ? materials.join(', ') : undefined,
    museum,
    objectURL: `https://www.wikidata.org/wiki/${entity.id}`,
    thumbnailUrl: image?.thumbnailUrl,
    title,
    wantToVisit: false,
    year: yearValue(liveClaims(claims[PROP.inception])[0]),
  };

  return {
    externalIds,
    inventoryNumber: pickInventoryNumber(
      claims[PROP.inventoryNumber],
      collectionId,
    ),
    painting,
    qid: entity.id,
  };
}

function referencedIds(entity: Entity, collections: string[]): string[] {
  const claims = entity.claims ?? {};
  const ids = new Set<string>();
  const add = (claim: Claim | undefined) => {
    const id = itemId(claim);
    if (id) ids.add(id);
  };
  for (const c of liveClaims(claims[PROP.creator])) add(c);
  for (const c of liveClaims(claims[PROP.material])) add(c);
  add(pickCollection(claims[PROP.collection], collections));
  add(liveClaims(claims[PROP.location], true)[0]);
  return [...ids];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search paintings on Wikidata and return parsed records in search-rank
 * order, with the raw ids a museum adapter needs for enrichment.
 */
export async function searchWikidataRecords(
  parameters: WikidataSearchParams,
): Promise<WikidataRecordSearchResult> {
  const {
    collections = [],
    externalIdProperties = [],
    idPrefix = 'wikidata',
    limit = 20,
    location,
    museum,
    query,
  } = parameters;

  if (!query || query.trim().length === 0) {
    return { records: [], totalResults: 0 };
  }

  const { ids, totalHits } = await searchIds(query, collections, limit);
  if (ids.length === 0) {
    return { records: [], totalResults: 0 };
  }

  const entities = await fetchEntities(ids, 'labels|descriptions|claims');

  const referenced = new Set<string>();
  for (const id of ids) {
    const entity = entities[id];
    if (entity) {
      for (const reference of referencedIds(entity, collections))
        referenced.add(reference);
    }
  }
  const referencedEntities =
    referenced.size > 0 ? await fetchEntities([...referenced], 'labels') : {};

  const context: ParseContext = {
    collections,
    externalIdProperties,
    idPrefix,
    labelOf: (id) =>
      id ? pickLabel(referencedEntities[id]?.labels) : undefined,
    location,
    museum,
  };

  const records: WikidataRecord[] = [];
  for (const id of ids) {
    const entity = entities[id];
    if (!entity) continue;
    const record = parseEntity(entity, context);
    if (record) records.push(record);
  }

  return { records, totalResults: totalHits };
}

/**
 * Search paintings on Wikidata, every museum unless `collections` narrows it.
 * Errors are logged and yield an empty result, as the other adapters do.
 */
export async function searchPaintings(
  parameters: WikidataSearchParams,
): Promise<WikidataSearchResult> {
  try {
    const { records, totalResults } = await searchWikidataRecords(parameters);
    return { paintings: records.map((r) => r.painting), totalResults };
  } catch (error) {
    console.error('Error searching Wikidata:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Infer location from museum name
 */
function inferLocationFromMuseum(museum: string): string | undefined {
  const museumLocations: Record<string, string> = {
    'Alte Pinakothek': 'Munich, Germany',
    'Art Institute of Chicago': 'Chicago, USA',
    'Galleria degli Uffizi': 'Florence, Italy',
    'Hermitage Museum': 'Saint Petersburg, Russia',
    'Kunsthistorisches Museum': 'Vienna, Austria',
    Louvre: 'Paris, France',
    Mauritshuis: 'The Hague, Netherlands',
    'Metropolitan Museum of Art': 'New York City, USA',
    MoMA: 'New York City, USA',
    "Musée d'Orsay": 'Paris, France',
    'Musée du Louvre': 'Paris, France',
    'Museo del Prado': 'Madrid, Spain',
    'Museum of Modern Art': 'New York City, USA',
    'National Gallery': 'London, UK',
    'National Gallery of Art': 'Washington D.C., USA',
    'Prado Museum': 'Madrid, Spain',
    Rijksmuseum: 'Amsterdam, Netherlands',
    'Tate Modern': 'London, UK',
    'Uffizi Gallery': 'Florence, Italy',
    'Van Gogh Museum': 'Amsterdam, Netherlands',
  };

  // Try exact match first
  if (museumLocations[museum]) {
    return museumLocations[museum];
  }

  // Try partial match
  for (const [name, location] of Object.entries(museumLocations)) {
    if (museum.includes(name) || name.includes(museum)) {
      return location;
    }
  }

  return undefined;
}

import type {
  MuseumSearchParams as MuseumSearchParameters,
  MuseumSearchResult,
  MuseumServiceAdapter,
} from './types/museumAdapter';

import { registerAdapter } from './museumAdapterRegistry';

export const wikidataAdapter: MuseumServiceAdapter = {
  museumId: 'WIKIDATA',
  async search(
    parameters: MuseumSearchParameters,
  ): Promise<MuseumSearchResult> {
    return searchPaintings({
      limit: parameters.maxResults,
      query: parameters.query,
    });
  },
};

registerAdapter(wikidataAdapter);
