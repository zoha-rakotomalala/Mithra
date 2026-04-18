import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const RIJKS_SEARCH_API = 'https://data.rijksmuseum.nl/search/collection';
const IIIF_BASE = 'https://iiif.micr.io';

/**
 * In-memory IIIF ID cache (kintopp-style).
 * Maps Rijksmuseum object URI → resolved IIIF ID (e.g., "AmWMg").
 * Once resolved, images can be constructed directly without the 3-hop chain.
 */
const iiifCache = new Map<string, string>();

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

    // Build search URL
    const searchParams = new URLSearchParams({
      imageAvailable: 'true',
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
    if (!title || title === 'Untitled') return null;

    const artist = cleanArtistName(extractArtist(data));
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

function extractTitle(data: any): string {
  if (data._label) return data._label;
  const names = data.identified_by || [];
  const title = names.find(
    (item: any) =>
      item.type === 'Name' &&
      (item.classified_as?.[0]?._label === 'Primary Name' ||
        !item.classified_as),
  );
  return title?.content || 'Untitled';
}

function extractArtist(data: any): string {
  if (data.produced_by?.carried_out_by) {
    const creators = Array.isArray(data.produced_by.carried_out_by)
      ? data.produced_by.carried_out_by
      : [data.produced_by.carried_out_by];
    const artist = creators[0];
    return (
      artist?._label || artist?.identified_by?.[0]?.content || 'Unknown Artist'
    );
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

function extractDimensions(data: any): string | undefined {
  if (!data.dimension) return undefined;
  const dims = Array.isArray(data.dimension)
    ? data.dimension
    : [data.dimension];
  const height = dims.find((d: any) =>
    d.classified_as?.[0]?._label?.toLowerCase().includes('height'),
  );
  const width = dims.find((d: any) =>
    d.classified_as?.[0]?._label?.toLowerCase().includes('width'),
  );
  if (height?.value && width?.value) {
    const unit = height.unit?._label || 'cm';
    return `${height.value} × ${width.value} ${unit}`;
  }
  return undefined;
}

function extractMedium(data: any): string | undefined {
  const materials: string[] = [];
  if (data.made_of) {
    const mats = Array.isArray(data.made_of) ? data.made_of : [data.made_of];
    materials.push(...mats.map((m: any) => m._label).filter(Boolean));
  }
  if (data.produced_by?.technique) {
    const techs = Array.isArray(data.produced_by.technique)
      ? data.produced_by.technique
      : [data.produced_by.technique];
    materials.push(...techs.map((t: any) => t._label).filter(Boolean));
  }
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
