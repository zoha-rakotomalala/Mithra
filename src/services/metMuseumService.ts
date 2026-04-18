import type { Painting } from '@/types/painting';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const objectCache = new Map<string, any>();

export type MetSearchParams = {
  hasImages?: boolean;
  query: string;
};

export type MetSearchResult = {
  paintings: Painting[];
  totalResults: number;
};

/**
 * Search Met Museum collection
 */
export async function searchMetMuseum(
  parameters: MetSearchParams,
): Promise<MetSearchResult> {
  try {
    const { hasImages = true, query } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParameters = new URLSearchParams({
      hasImages: hasImages.toString(),
      q: query.trim(),
    });

    const searchUrl = `${MET_API_BASE}/search?${queryParameters.toString()}`;
    console.log('🏛️ Searching Met Museum:', searchUrl);

    const data = await museumApi.get(searchUrl).json<any>();
    const objectIDs = data.objectIDs || [];
    const total = data.total || 0;

    if (objectIDs.length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Fetch details for first 40 objects
    const objectsToFetch = objectIDs.slice(0, 40);
    const paintings = await fetchObjectDetails(objectsToFetch);

    // Filter to paintings only, remove nulls
    const paintingsOnly = paintings
      .filter((p) => p !== null && isPainting(p))
      .slice(0, 30) as Painting[];

    return {
      paintings: paintingsOnly,
      totalResults: total,
    };
  } catch (error) {
    console.error('Error searching Met Museum:', error);
    throw new Error('Failed to search Met Museum collection.');
  }
}

/**
 * Search by artist name
 */
export async function searchMetByArtist(
  artistName: string,
): Promise<MetSearchResult> {
  return searchMetMuseum({
    hasImages: true,
    query: artistName,
  });
}

/**
 * Fetch details for multiple object IDs
 */
async function fetchObjectDetails(
  objectIDs: number[],
): Promise<(null | Painting)[]> {
  const BATCH_SIZE = 10;
  const results: (null | Painting)[] = [];

  for (let index = 0; index < objectIDs.length; index += BATCH_SIZE) {
    const batch = objectIDs.slice(index, index + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((id) => fetchObjectDetail(id)),
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Fetch details for a single object
 */
async function fetchObjectDetail(objectID: number): Promise<null | Painting> {
  try {
    const cacheKey = objectID.toString();
    if (objectCache.has(cacheKey)) {
      return parseMetObject(objectCache.get(cacheKey), objectID);
    }

    const url = `${MET_API_BASE}/objects/${objectID}`;
    const data = await museumApi.get(url).json<any>();
    objectCache.set(cacheKey, data);

    return parseMetObject(data, objectID);
  } catch (error) {
    console.error(`Error fetching Met object ${objectID}:`, error);
    return null;
  }
}

/**
 * Check if object is a painting
 */
function isPainting(data: any): boolean {
  const objectType = data.objectName?.toLowerCase() || '';
  const classification = data.classification?.toLowerCase() || '';
  const medium = data.medium?.toLowerCase() || '';

  return (
    objectType.includes('painting') ||
    classification.includes('painting') ||
    medium.includes('oil') ||
    medium.includes('canvas') ||
    medium.includes('panel') ||
    medium.includes('tempera') ||
    medium.includes('acrylic')
  );
}

/**
 * Parse Met Museum object into Painting format
 * IMPROVED: Smart image URL handling with fallbacks
 */
function parseMetObject(data: any, objectID: number): null | Painting {
  try {
    const title = data.title || 'Untitled';
    const artist = extractArtist(data);
    const year = extractYear(data);

    // SMART IMAGE EXTRACTION
    const images = extractImages(data);
    if (!images) {
      return null; // Skip if no images at all
    }

    const dimensions = data.dimensions || undefined;
    const medium = data.medium || undefined;
    const description = extractDescription(data);

    return {
      artist,
      color: generateColorFromString(title),
      description,
      dimensions,
      id: `met-${objectID}`,
      imageUrl: images.full, // Full resolution for detail view
      isSeen: false,
      location: 'New York City, USA',
      medium,
      museum: 'Metropolitan Museum of Art',
      thumbnailUrl: images.thumbnail, // Small for lists/grids
      title,
      wantToVisit: false,
      year,
    };
  } catch (error) {
    console.error('Error parsing Met object:', error);
    return null;
  }
}

/**
 * SMART IMAGE EXTRACTION
 * Returns both full and thumbnail URLs with proper fallbacks
 */
function extractImages(data: any): { full: string; thumbnail: string } | null {
  let full = '';
  let thumbnail = '';

  // Primary image (best quality)
  if (data.primaryImage && data.primaryImage !== '') {
    full = data.primaryImage;
  }

  // Primary image small (thumbnail)
  if (data.primaryImageSmall && data.primaryImageSmall !== '') {
    thumbnail = data.primaryImageSmall;
  }

  // Fallback to additional images if no primary
  if (!full && data.additionalImages && data.additionalImages.length > 0) {
    full = data.additionalImages[0];
  }

  // If we have full but no thumbnail, use full for both
  if (full && !thumbnail) {
    thumbnail = full;
  }

  // If we have thumbnail but no full, use thumbnail for both
  if (thumbnail && !full) {
    full = thumbnail;
  }

  // Return null if no images at all
  if (!full && !thumbnail) {
    return null;
  }

  return { full, thumbnail };
}

/**
 * Extract artist name
 */
function extractArtist(data: any): string {
  if (data.artistDisplayName && data.artistDisplayName !== '') {
    return data.artistDisplayName;
  }
  if (data.artistAlphaSort && data.artistAlphaSort !== '') {
    return data.artistAlphaSort;
  }
  if (data.culture && data.culture !== '') {
    return data.culture;
  }
  return 'Unknown Artist';
}

/**
 * Extract creation year
 */
function extractYear(data: any): number | undefined {
  if (data.objectDate) {
    const match = data.objectDate.match(/\d{4}/);
    if (match) return Number.parseInt(match[0]);
  }

  if (data.objectBeginDate && data.objectBeginDate > 0) {
    return data.objectBeginDate;
  }

  if (data.objectEndDate && data.objectEndDate > 0) {
    return data.objectEndDate;
  }

  return undefined;
}

/**
 * Extract description
 */
function extractDescription(data: any): string | undefined {
  const parts: string[] = [];

  if (data.objectName && data.objectName !== '') {
    parts.push(data.objectName);
  }

  if (data.culture && data.culture !== '') {
    parts.push(`${data.culture} culture`);
  }

  if (data.period && data.period !== '') {
    parts.push(data.period);
  }

  if (data.dynasty && data.dynasty !== '') {
    parts.push(data.dynasty);
  }

  if (data.creditLine && data.creditLine !== '') {
    parts.push(data.creditLine);
  }

  return parts.length > 0 ? parts.join('. ') : undefined;
}

/**
 * Get popular artists for quick search
 */
export function getPopularMetArtists(): string[] {
  return [
    'Vincent van Gogh',
    'Claude Monet',
    'Paul Cézanne',
    'Edgar Degas',
    'Pierre-Auguste Renoir',
    'Rembrandt',
    'Johannes Vermeer',
    'Caravaggio',
    'El Greco',
    'Édouard Manet',
    'Camille Pissarro',
    'Paul Gauguin',
    'Henri de Toulouse-Lautrec',
    'Gustave Courbet',
    'Jean-Baptiste-Camille Corot',
  ];
}

import type {
  MuseumServiceAdapter,
  MuseumSearchParams,
  MuseumSearchResult,
} from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const metMuseumAdapter: MuseumServiceAdapter = {
  museumId: 'MET',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    const result = await searchMetMuseum({
      query: params.query,
      hasImages: true,
    });
    return {
      paintings: result.paintings.slice(0, params.maxResults),
      totalResults: result.totalResults,
    };
  },
};

registerAdapter(metMuseumAdapter);
