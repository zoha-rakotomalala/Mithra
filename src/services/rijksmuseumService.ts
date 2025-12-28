import type { Painting } from '@/types/painting';

const RIJKS_SEARCH_API = 'https://data.rijksmuseum.nl/search/collection';
const RIJKS_OBJECT_API = 'https://id.rijksmuseum.nl';

// Cache for resolved object details
const objectCache = new Map<string, any>();

export interface RijksSearchParams {
  query?: string;
  creator?: string;
  title?: string;
  type?: string;
  limit?: number;
}

export interface RijksSearchResult {
  paintings: Painting[];
  totalResults: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * Search Rijksmuseum collection
 */
export async function searchRijksmuseum(
  params: RijksSearchParams
): Promise<RijksSearchResult> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    // Default to paintings with images
    queryParams.append('type', 'painting');
    queryParams.append('imageAvailable', 'true');

    // Add search parameters
    if (params.creator) {
      queryParams.append('creator', params.creator);
    }
    if (params.title) {
      queryParams.append('title', params.title);
    }
    if (params.query) {
      // Use description search for general queries
      queryParams.append('description', params.query);
    }

    const searchUrl = `${RIJKS_SEARCH_API}?${queryParams.toString()}`;

    console.log('🎨 Searching Rijksmuseum:', searchUrl);

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Rijksmuseum API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract object IDs from search results
    const objectIds = data.orderedItems?.map((item: any) => item.id) || [];

    // Resolve object details (fetch full info for each)
    const paintings = await resolveObjects(objectIds.slice(0, params.limit || 20));

    return {
      paintings: paintings.filter(p => p !== null) as Painting[],
      totalResults: data.partOf?.totalItems || 0,
      hasMore: !!data.next,
      nextPageToken: extractPageToken(data.next?.id),
    };
  } catch (error) {
    console.error('Error searching Rijksmuseum:', error);
    throw new Error('Failed to search Rijksmuseum collection.');
  }
}

/**
 * Search by artist name
 */
export async function searchRijksmuseumByArtist(
  artistName: string,
  limit = 30
): Promise<RijksSearchResult> {
  return searchRijksmuseum({
    creator: artistName,
    limit,
  });
}

/**
 * Resolve object IDs to full painting data
 */
async function resolveObjects(objectIds: string[]): Promise<(Painting | null)[]> {
  const promises = objectIds.map(id => resolveObject(id));
  return Promise.all(promises);
}

/**
 * Resolve a single object ID to painting data
 * Uses cache to avoid duplicate requests
 */
async function resolveObject(objectId: string): Promise<Painting | null> {
  try {
    // Check cache first
    if (objectCache.has(objectId)) {
      return parsePaintingFromObject(objectCache.get(objectId));
    }

    // Fetch object data (accepts JSON via content negotiation)
    const response = await fetch(objectId, {
      headers: {
        'Accept': 'application/ld+json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch object ${objectId}`);
      return null;
    }

    const data = await response.json();

    // Cache the result
    objectCache.set(objectId, data);

    return parsePaintingFromObject(data);
  } catch (error) {
    console.error(`Error resolving object ${objectId}:`, error);
    return null;
  }
}

/**
 * Parse Rijksmuseum object data into Painting format
 */
function parsePaintingFromObject(data: any): Painting | null {
  try {
    // Extract basic info
    const title = extractTitle(data);
    const artist = extractArtist(data);
    const year = extractYear(data);
    const imageUrl = extractImage(data);
    const dimensions = extractDimensions(data);
    const medium = extractMedium(data);
    const description = extractDescription(data);

    if (!title || !artist) {
      return null; // Skip if missing essential data
    }

    return {
      id: generateIdFromUrl(data.id || data['@id']),
      title,
      artist,
      year,
      medium,
      dimensions,
      museum: 'Rijksmuseum',
      location: 'Amsterdam, Netherlands',
      description,
      imageUrl,
      color: generateColorFromString(title),
      isSeen: false,
      isInPalette: false,
    };
  } catch (error) {
    console.error('Error parsing object:', error);
    return null;
  }
}

/**
 * Extract title from object data
 */
function extractTitle(data: any): string | undefined {
  // Linked Art format
  if (data._label) return data._label;
  if (data.identified_by) {
    const title = data.identified_by.find((id: any) =>
      id.type === 'Name' || id.classified_as?.some((c: any) => c._label === 'Primary Name')
    );
    if (title?.content) return title.content;
  }
  return 'Untitled';
}

/**
 * Extract artist name from object data
 */
function extractArtist(data: any): string | undefined {
  if (data.produced_by?.carried_out_by) {
    const creators = Array.isArray(data.produced_by.carried_out_by)
      ? data.produced_by.carried_out_by
      : [data.produced_by.carried_out_by];

    const artist = creators[0];
    return artist?._label || artist?.identified_by?.[0]?.content || 'Unknown Artist';
  }
  return 'Unknown Artist';
}

/**
 * Extract creation year
 */
function extractYear(data: any): number | undefined {
  if (data.produced_by?.timespan) {
    const timespan = data.produced_by.timespan;
    // Try begin_of_the_begin first (most specific)
    if (timespan.begin_of_the_begin) {
      return parseInt(timespan.begin_of_the_begin.split('-')[0]);
    }
    // Fallback to identified_by
    if (timespan.identified_by) {
      const dateStr = timespan.identified_by.find((id: any) => id.type === 'Name')?.content;
      if (dateStr) {
        const match = dateStr.match(/\d{4}/);
        if (match) return parseInt(match[0]);
      }
    }
  }
  return undefined;
}

/**
 * Extract image URL
 */
function extractImage(data: any): string | undefined {
  // Look for digital representation
  if (data.representation) {
    const reps = Array.isArray(data.representation) ? data.representation : [data.representation];
    // Find highest quality image
    const image = reps.find((rep: any) =>
      rep.access_point?.[0]?.id || rep.digitally_shown_by?.[0]?.access_point?.[0]?.id
    );

    return image?.access_point?.[0]?.id ||
           image?.digitally_shown_by?.[0]?.access_point?.[0]?.id;
  }
  return undefined;
}

/**
 * Extract dimensions
 */
function extractDimensions(data: any): string | undefined {
  if (data.dimension) {
    const dims = Array.isArray(data.dimension) ? data.dimension : [data.dimension];
    const height = dims.find((d: any) => d.classified_as?.[0]?._label === 'height');
    const width = dims.find((d: any) => d.classified_as?.[0]?._label === 'width');

    if (height?.value && width?.value) {
      return `${height.value} cm × ${width.value} cm`;
    }
  }
  return undefined;
}

/**
 * Extract medium/technique
 */
function extractMedium(data: any): string | undefined {
  if (data.made_of) {
    const materials = Array.isArray(data.made_of) ? data.made_of : [data.made_of];
    return materials.map((m: any) => m._label).filter(Boolean).join(', ');
  }
  if (data.produced_by?.technique) {
    const techniques = Array.isArray(data.produced_by.technique)
      ? data.produced_by.technique
      : [data.produced_by.technique];
    return techniques.map((t: any) => t._label).filter(Boolean).join(', ');
  }
  return undefined;
}

/**
 * Extract description
 */
function extractDescription(data: any): string | undefined {
  if (data.referred_to_by) {
    const descriptions = Array.isArray(data.referred_to_by)
      ? data.referred_to_by
      : [data.referred_to_by];

    const desc = descriptions.find((ref: any) =>
      ref.type === 'LinguisticObject' && ref.content
    );

    return desc?.content;
  }
  return undefined;
}

/**
 * Extract page token from next page URL
 */
function extractPageToken(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/pageToken=([^&]+)/);
  return match ? match[1] : undefined;
}

/**
 * Generate numeric ID from Rijksmuseum URL
 */
function generateIdFromUrl(url: string): number {
  // Extract number from URL like https://id.rijksmuseum.nl/200100988
  const match = url.match(/\/(\d+)$/);
  return match ? parseInt(match[1]) : Date.now();
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
 * Get popular Rijksmuseum artists for quick search
 */
export function getPopularRijksmuseumArtists(): string[] {
  return [
    'Rembrandt van Rijn',
    'Johannes Vermeer',
    'Frans Hals',
    'Jan Steen',
    'Vincent van Gogh',
    'Pieter de Hooch',
    'Jacob van Ruisdael',
    'Gerard ter Borch',
    'Hendrick Avercamp',
    'Willem Claeszoon Heda',
  ];
}