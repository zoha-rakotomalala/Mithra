import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const RIJKS_SEARCH_API = 'https://data.rijksmuseum.nl/search/collection';
const IIIF_BASE = 'https://iiif.micr.io';

/**
 * Getty AAT concept ids the Rijksmuseum Linked Art records use in place of
 * human-readable `_label`s (the records carry none). Matched by URI suffix.
 */
const AAT = {
  english: '300388277',
  dutch: '300388256',
  preferredTerm: '300404670',
  height: '300055644',
  width: '300055647',
  materialsStatement: '300435429',
} as const;

/**
 * In-memory IIIF ID cache (kintopp-style).
 * Maps Rijksmuseum object URI → resolved IIIF ID (e.g., "AmWMg").
 * Once resolved, images can be constructed directly without the 3-hop chain.
 */
const iiifCache = new Map<string, string>();

/**
 * Maps a Rijksmuseum actor URI (https://id.rijksmuseum.nl/2103429) to its
 * display name. Artists are referenced by URI only, so each one costs a fetch
 * the first time it appears.
 */
const actorNameCache = new Map<string, string>();

/**
 * Extract IIIF ID from a micr.io URL.
 * e.g., "https://iiif.micr.io/AmWMg/full/max/0/default.jpg" → "AmWMg"
 */
function extractIiifId(url: string): string | null {
  const match = url.match(/iiif\.micr\.io\/([^/]+)/);
  return match ? match[1] : null;
}

interface RijksSearchParams {
  query: string;
  searchType: 'artist' | 'title';
  limit?: number;
}

interface RijksSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Rijksmuseum collection using Linked Art API
 */
export async function searchRijksmuseum(
  params: RijksSearchParams,
): Promise<RijksSearchResult> {
  try {
    const { query, limit = 10 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Build search URL. Without `type`, the API returns every object kind
    // (prints, drawings, photos): 1,447 Rembrandts instead of 24 paintings.
    const searchParams = new URLSearchParams({
      imageAvailable: 'true',
      type: 'painting',
    });

    if (params.searchType === 'artist') {
      searchParams.set('creator', query.trim());
    } else {
      searchParams.set('title', query.trim());
      searchParams.set('description', query.trim());
    }

    const searchUrl = `${RIJKS_SEARCH_API}?${searchParams.toString()}`;
    console.log('🇳🇱 Searching Rijksmuseum:', searchUrl);

    const data = await museumApi.get(searchUrl).json<any>();
    const totalItems = data.partOf?.totalItems || 0;

    const rawItems = Array.isArray(data.orderedItems) ? data.orderedItems : [];
    const validItems = rawItems.filter(
      (item: any) => item && typeof item.id === 'string',
    );

    if (validItems.length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const objectIds = validItems.slice(0, limit).map((item: any) => item.id);
    console.log(
      `🇳🇱 Rijks search: ${rawItems.length} raw → ${objectIds.length} to resolve`,
    );

    const paintings = await resolveObjects(objectIds);
    console.log(`🇳🇱 Rijksmuseum: ${paintings.length} paintings resolved`);

    return { paintings, totalResults: totalItems };
  } catch (error) {
    console.error('Error searching Rijksmuseum:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Resolve multiple objects with concurrency limit of 3.
 */
async function resolveObjects(objectIds: string[]): Promise<Painting[]> {
  const concurrency = 3;
  const results: (Painting | null)[] = [];

  for (let i = 0; i < objectIds.length; i += concurrency) {
    const batch = objectIds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((id) => resolveObject(id)),
    );
    results.push(...batchResults);
  }

  return results.filter((p): p is Painting => p !== null);
}

/**
 * Resolve a single object ID to painting data
 */
async function resolveObject(objectId: string): Promise<Painting | null> {
  try {
    const data = await museumApi
      .get(objectId, {
        headers: { Accept: 'application/ld+json' },
        timeout: 15000,
      })
      .json<any>();
    return parseLinkedArtObject(data);
  } catch (error) {
    console.error(`Error resolving Rijks object ${objectId}:`, error);
    return null;
  }
}

/**
 * Parse Linked Art object into Painting format
 */
async function parseLinkedArtObject(data: any): Promise<Painting | null> {
  try {
    const types = Array.isArray(data.type) ? data.type : [data.type];
    if (!types.includes('HumanMadeObject')) return null;

    const title = extractTitle(data);
    if (!title) return null;

    const artist = cleanArtistName(await resolveArtist(data));
    const imageUrl = (await resolveImageUrl(data)) ?? undefined;
    const year = extractYear(data);
    const dimensions = extractDimensions(data);
    const medium = extractMedium(data);

    // Build thumbnail from IIIF URL
    const thumbnailUrl = imageUrl
      ? imageUrl.replace('/full/max/', '/full/!400,400/')
      : undefined;

    return {
      id: `rijks-${generateIdFromUrl(data.id)}`,
      title,
      artist,
      year,
      medium,
      dimensions,
      museum: 'Rijksmuseum',
      location: 'Amsterdam, Netherlands',
      description: undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Rijks Linked Art object:', error);
    return null;
  }
}

/**
 * Resolve image URL with IIIF cache (kintopp-style).
 *
 * Fast path: if we've already resolved this object's IIIF ID, construct the URL directly (0 hops).
 * Slow path: follow the 3-hop Linked Art chain, cache the IIIF ID for next time.
 *
 * Chain: Object → shows[].id (VisualItem) → digitally_shown_by[].id (DigitalObject) → access_point[].id (IIIF URL)
 */
async function resolveImageUrl(data: any): Promise<string | null> {
  const objectUri = data.id;

  // Fast path: IIIF ID already cached
  const cachedIiifId = iiifCache.get(objectUri);
  if (cachedIiifId) {
    return `${IIIF_BASE}/${cachedIiifId}/full/max/0/default.jpg`;
  }

  // Check inline image first (some objects embed it directly)
  const inline = extractInlineImage(data);
  if (inline) {
    const id = extractIiifId(inline);
    if (id && objectUri) iiifCache.set(objectUri, id);
    return inline;
  }

  // Slow path: 3-hop chain
  const visualItemUrl = extractFirstId(data.shows);
  if (!visualItemUrl) return null;

  try {
    const visualItem = await museumApi
      .get(visualItemUrl, {
        headers: { Accept: 'application/ld+json' },
        timeout: 12000,
      })
      .json<any>();

    const digitalObjectUrl = extractFirstId(visualItem.digitally_shown_by);
    if (!digitalObjectUrl) return null;

    const digitalObject = await museumApi
      .get(digitalObjectUrl, {
        headers: { Accept: 'application/ld+json' },
        timeout: 12000,
      })
      .json<any>();

    const iiifUrl = extractFirstId(digitalObject.access_point);
    if (!iiifUrl) return null;

    // Cache the IIIF ID for fast path next time
    const id = extractIiifId(iiifUrl);
    if (id && objectUri) {
      iiifCache.set(objectUri, id);
      console.log(`🇳🇱 Cached IIIF ID: ${objectUri} → ${id}`);
    }

    return iiifUrl;
  } catch (error) {
    console.error('Error resolving Rijks image chain:', error);
    return null;
  }
}

/**
 * Check for image URLs embedded directly in the object (no extra hops needed)
 */
function extractInlineImage(data: any): string | null {
  if (data.representation) {
    const reps = Array.isArray(data.representation)
      ? data.representation
      : [data.representation];
    for (const rep of reps) {
      if (rep.access_point?.[0]?.id) return rep.access_point[0].id;
      if (rep.digitally_shown_by?.[0]?.access_point?.[0]?.id) {
        return rep.digitally_shown_by[0].access_point[0].id;
      }
    }
  }
  return null;
}

function extractFirstId(field: any): string | null {
  if (!field) return null;
  const items = Array.isArray(field) ? field : [field];
  return items[0]?.id ?? null;
}

/** True when any concept in `list` is the given Getty AAT id. */
function hasConcept(list: any, aatId: string): boolean {
  if (!list) return false;
  const items = Array.isArray(list) ? list : [list];
  return items.some((c: any) => {
    if (typeof c?.id === 'string' && c.id.endsWith(`/${aatId}`)) return true;
    return hasConcept(c?.equivalent, aatId);
  });
}

function isEnglish(node: any): boolean {
  return hasConcept(node?.language, AAT.english);
}

function isDutch(node: any): boolean {
  return hasConcept(node?.language, AAT.dutch);
}

function isPreferred(node: any): boolean {
  return hasConcept(node?.classified_as, AAT.preferredTerm);
}

/** The English `@value` of a `notation` list, or any value as fallback. */
function notationText(node: any): string | undefined {
  const notes = Array.isArray(node?.notation) ? node.notation : [];
  const en = notes.find((n: any) => n['@language'] === 'en');
  return (en ?? notes[0])?.['@value'];
}

/**
 * Pick the display title. The records carry several Names per object with no
 * `_label`: English and Dutch, each in preferred and alternate forms, keyed by
 * Getty AAT ids. Order: English preferred, English, Dutch preferred, Dutch, any.
 */
function extractTitle(data: any): string | undefined {
  if (typeof data._label === 'string' && data._label) return data._label;
  const names = (data.identified_by || []).filter(
    (n: any) => n?.type === 'Name' && typeof n.content === 'string',
  );
  const pick =
    names.find((n: any) => isEnglish(n) && isPreferred(n)) ??
    names.find(isEnglish) ??
    names.find((n: any) => isDutch(n) && isPreferred(n)) ??
    names.find(isDutch) ??
    names[0];
  const content = pick?.content?.trim();
  return content || undefined;
}

/**
 * Artists are not inlined: `produced_by.part[].carried_out_by[]` holds actor
 * URIs only, so the first one is fetched (and cached) to read its name.
 * Attributed works ("attributed to", "workshop of") carry the actor under
 * `part[].assigned_by[].assigned` instead. The legacy
 * `produced_by.carried_out_by` shape is still honoured.
 */
async function resolveArtist(data: any): Promise<string> {
  const production = data.produced_by;
  if (!production) return 'Unknown Artist';

  const actors: any[] = [];
  const push = (field: any) => {
    if (!field) return;
    actors.push(...(Array.isArray(field) ? field : [field]));
  };
  push(production.carried_out_by);
  const parts = Array.isArray(production.part) ? production.part : [];
  for (const part of parts) {
    push(part?.carried_out_by);
    const assignments = Array.isArray(part?.assigned_by)
      ? part.assigned_by
      : [];
    for (const assignment of assignments) {
      if (assignment?.assigned_property === 'carried_out_by') {
        push(assignment.assigned);
      }
    }
  }

  const actor = actors.find((a) => a && (a._label || a.id));
  if (!actor) return 'Unknown Artist';
  if (actor._label) return actor._label;
  if (typeof actor.id !== 'string') return 'Unknown Artist';

  const cached = actorNameCache.get(actor.id);
  if (cached) return cached;

  try {
    const person = await museumApi
      .get(actor.id, {
        headers: { Accept: 'application/ld+json' },
        timeout: 12000,
      })
      .json<any>();
    const names = (person.identified_by || []).filter(
      (n: any) => n?.type === 'Name' && typeof n.content === 'string',
    );
    const name =
      names.find(isPreferred)?.content ?? names[0]?.content ?? person._label;
    if (name) {
      actorNameCache.set(actor.id, name);
      return name;
    }
  } catch (error) {
    console.error(`Error resolving Rijks actor ${actor.id}:`, error);
  }
  return 'Unknown Artist';
}

function extractYear(data: any): number | undefined {
  const timespan = data.produced_by?.timespan;
  if (!timespan) return undefined;
  if (timespan.begin_of_the_begin) {
    const match = timespan.begin_of_the_begin.match(/\d{4}/);
    if (match) return parseInt(match[0]);
  }
  if (timespan.identified_by) {
    const dateLabel = timespan.identified_by.find(
      (id: any) => id.type === 'Name',
    );
    if (dateLabel?.content) {
      const match = dateLabel.content.match(/\d{4}/);
      if (match) return parseInt(match[0]);
    }
  }
  return undefined;
}

/**
 * Height and width are typed by AAT id (via `classified_as[].equivalent`) or
 * by an English `notation`; `_label` is accepted when present.
 */
function extractDimensions(data: any): string | undefined {
  if (!data.dimension) return undefined;
  const dims = Array.isArray(data.dimension)
    ? data.dimension
    : [data.dimension];
  const isKind = (d: any, aatId: string, word: string) => {
    const cls = d?.classified_as;
    if (hasConcept(cls, aatId)) return true;
    const list = Array.isArray(cls) ? cls : [cls];
    return list.some(
      (c: any) =>
        c?._label?.toLowerCase().includes(word) ||
        notationText(c)?.toLowerCase().includes(word),
    );
  };
  const height = dims.find((d: any) => isKind(d, AAT.height, 'height'));
  const width = dims.find((d: any) => isKind(d, AAT.width, 'width'));
  if (height?.value && width?.value) {
    const unit = height.unit?._label ?? 'cm';
    return `${height.value} × ${width.value} ${unit}`;
  }
  return undefined;
}

/**
 * Prefer the museum's own English materials statement ("oil on panel");
 * fall back to the material and technique notations.
 */
function extractMedium(data: any): string | undefined {
  const statements = (data.referred_to_by || []).filter(
    (r: any) =>
      typeof r?.content === 'string' &&
      hasConcept(r.classified_as, AAT.materialsStatement),
  );
  const statement = statements.find(isEnglish) ?? statements[0];
  if (statement?.content) return statement.content;

  const materials: string[] = [];
  const collect = (field: any) => {
    if (!field) return;
    const list = Array.isArray(field) ? field : [field];
    for (const item of list) {
      const text = item?._label ?? notationText(item);
      if (text) materials.push(text);
    }
  };
  collect(data.made_of);
  collect(data.produced_by?.technique);
  return materials.length > 0 ? materials.join(', ') : undefined;
}
function generateIdFromUrl(url: string): string {
  const match = url.match(/([^\/]+)$/);
  return match ? match[1] : Date.now().toString();
}

export function getPopularRijksmuseumArtists(): string[] {
  return [
    'Rembrandt van Rijn',
    'Johannes Vermeer',
    'Frans Hals',
    'Jan Steen',
    'Vincent van Gogh',
  ];
}

import type {
  MuseumServiceAdapter,
  MuseumSearchParams,
  MuseumSearchResult,
} from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const rijksmuseumAdapter: MuseumServiceAdapter = {
  museumId: 'RIJKS',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchRijksmuseum({
      query: params.query,
      searchType: params.searchType,
      limit: params.maxResults,
    });
  },
};

registerAdapter(rijksmuseumAdapter);
