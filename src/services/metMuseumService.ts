import type { Painting } from '@/types/painting';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const objectCache = new Map<string, any>();

export interface MetSearchParams {
  query: string;
  hasImages?: boolean;
}

export interface MetSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Met Museum collection
 */
export async function searchMetMuseum(
  params: MetSearchParams
): Promise<MetSearchResult> {
  try {
    const { query, hasImages = true } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      q: query.trim(),
      hasImages: hasImages.toString(),
    });

    const searchUrl = `${MET_API_BASE}/search?${queryParams.toString()}`;
    console.log('🏛️ Searching Met Museum:', searchUrl);

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Met Museum API error: ${response.status}`);
    }

    const data = await response.json();
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
      .filter(p => p !== null && isPainting(p))
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
  artistName: string
): Promise<MetSearchResult> {
  return searchMetMuseum({
    query: artistName,
    hasImages: true,
  });
}

/**
 * Fetch details for multiple object IDs
 */
async function fetchObjectDetails(objectIDs: number[]): Promise<(Painting | null)[]> {
  const BATCH_SIZE = 10;
  const results: (Painting | null)[] = [];

  for (let i = 0; i < objectIDs.length; i += BATCH_SIZE) {
    const batch = objectIDs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(id => fetchObjectDetail(id))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Fetch details for a single object
 */
async function fetchObjectDetail(objectID: number): Promise<Painting | null> {
  try {
    const cacheKey = objectID.toString();
    if (objectCache.has(cacheKey)) {
      return parseMetObject(objectCache.get(cacheKey), objectID);
    }

    const url = `${MET_API_BASE}/objects/${objectID}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch Met object ${objectID}`);
      return null;
    }

    const data = await response.json();
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
function parseMetObject(data: any, objectID: number): Painting | null {
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
      id: objectID,
      title,
      artist,
      year,
      medium,
      dimensions,
      museum: 'Metropolitan Museum of Art',
      location: 'New York City, USA',
      description,
      imageUrl: images.full,        // Full resolution for detail view
      thumbnailUrl: images.thumbnail, // Small for lists/grids
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
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
    if (match) return parseInt(match[0]);
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
 * Generate consistent color from string
 */
function generateColorFromString(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#95E1D3', '#F38181',
    '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#E8B86D',
    '#F4976C', '#4A5F7A', '#2C3639', '#D4AF37', '#7FB3D5',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
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