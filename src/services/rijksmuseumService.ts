import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';

const RIJKS_SEARCH_API = 'https://data.rijksmuseum.nl/search/collection';

interface RijksSearchParams {
  query: string;
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
  params: RijksSearchParams
): Promise<RijksSearchResult> {
  try {
    const { query, limit = 30 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Build search URL - use description for broad search
    const searchParams = new URLSearchParams({
      description: query.trim(),
      imageAvailable: 'true',
    });

    const searchUrl = `${RIJKS_SEARCH_API}?${searchParams.toString()}`;
    console.log('🇳🇱 Searching Rijksmuseum:', searchUrl);

    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.warn(`Rijksmuseum search error: ${response.status}`);
      return { paintings: [], totalResults: 0 };
    }

    const data = await response.json();
    const orderedItems = data.orderedItems || [];
    const totalItems = data.partOf?.totalItems || 0;

    if (orderedItems.length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Fetch full objects (first N results)
    const objectIds = orderedItems.slice(0, limit).map((item: any) => item.id);
    const paintings = await resolveObjects(objectIds);

    console.log(`🇳🇱 Rijksmuseum: ${paintings.length} paintings resolved`);

    return {
      paintings,
      totalResults: totalItems,
    };
  } catch (error) {
    console.error('Error searching Rijksmuseum:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Resolve multiple object IDs to full painting data
 */
async function resolveObjects(objectIds: string[]): Promise<Painting[]> {
  const promises = objectIds.map(id => resolveObject(id));
  const results = await Promise.all(promises);
  return results.filter((p): p is Painting => p !== null);
}

/**
 * Resolve a single object ID to painting data
 */
async function resolveObject(objectId: string): Promise<Painting | null> {
  try {
    const response = await fetch(objectId, {
      headers: {
        'Accept': 'application/ld+json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to resolve Rijks object: ${objectId}`);
      return null;
    }

    const data = await response.json();
    return parseLinkedArtObject(data);
  } catch (error) {
    console.error(`Error resolving Rijks object ${objectId}:`, error);
    return null;
  }
}

/**
 * Parse Linked Art object into Painting format
 */
function parseLinkedArtObject(data: any): Painting | null {
  try {
    // Must be a HumanMadeObject
    if (data.type !== 'HumanMadeObject') return null;

    // Extract title
    const title = extractTitle(data);
    if (!title || title === 'Untitled') return null;

    // Extract artist
    const artistDisplay = extractArtist(data);
    const artist = cleanArtistName(artistDisplay);

    // Extract image - THIS IS THE KEY FIX
    const imageUrl = extractImage(data);
    if (!imageUrl) {
      console.log(`❌ No image for: ${title}`);
      return null;
    }

    // Extract year
    const year = extractYear(data);

    // Extract dimensions
    const dimensions = extractDimensions(data);

    // Extract medium
    const medium = extractMedium(data);

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
      thumbnailUrl: imageUrl,
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
 * Extract title from Linked Art object
 */
function extractTitle(data: any): string {
  if (data._label) return data._label;

  const names = data.identified_by || [];
  const title = names.find((item: any) =>
    item.type === 'Name' &&
    (item.classified_as?.[0]?._label === 'Primary Name' || !item.classified_as)
  );

  return title?.content || 'Untitled';
}

/**
 * Extract artist from Linked Art object
 */
function extractArtist(data: any): string {
  if (data.produced_by?.carried_out_by) {
    const creators = Array.isArray(data.produced_by.carried_out_by)
      ? data.produced_by.carried_out_by
      : [data.produced_by.carried_out_by];

    const artist = creators[0];
    return artist?._label ||
           artist?.identified_by?.[0]?.content ||
           'Unknown Artist';
  }
  return 'Unknown Artist';
}

/**
 * Extract image URL - FIXED to handle both patterns
 */
function extractImage(data: any): string | null {
  // Pattern 1: representation (standard Linked Art)
  if (data.representation) {
    const reps = Array.isArray(data.representation)
      ? data.representation
      : [data.representation];

    for (const rep of reps) {
      // Try access_point first
      if (rep.access_point?.[0]?.id) {
        return rep.access_point[0].id;
      }
      // Try digitally_shown_by
      if (rep.digitally_shown_by?.[0]?.access_point?.[0]?.id) {
        return rep.digitally_shown_by[0].access_point[0].id;
      }
    }
  }

  // Pattern 2: shows (Rijksmuseum specific)
  if (data.shows) {
    const shows = Array.isArray(data.shows) ? data.shows : [data.shows];

    for (const show of shows) {
      if (show.digitally_shown_by?.[0]?.access_point?.[0]?.id) {
        return show.digitally_shown_by[0].access_point[0].id;
      }
    }
  }

  // Pattern 3: subject_of with digital representations
  if (data.subject_of) {
    const subjects = Array.isArray(data.subject_of)
      ? data.subject_of
      : [data.subject_of];

    for (const subj of subjects) {
      if (subj.digitally_carried_by?.[0]?.access_point?.[0]?.id) {
        return subj.digitally_carried_by[0].access_point[0].id;
      }
    }
  }

  return null;
}

/**
 * Extract creation year
 */
function extractYear(data: any): number | undefined {
  const timespan = data.produced_by?.timespan;
  if (!timespan) return undefined;

  // Try begin_of_the_begin first
  if (timespan.begin_of_the_begin) {
    const match = timespan.begin_of_the_begin.match(/\d{4}/);
    if (match) return parseInt(match[0]);
  }

  // Try identified_by
  if (timespan.identified_by) {
    const dateLabel = timespan.identified_by.find((id: any) => id.type === 'Name');
    if (dateLabel?.content) {
      const match = dateLabel.content.match(/\d{4}/);
      if (match) return parseInt(match[0]);
    }
  }

  return undefined;
}

/**
 * Extract dimensions
 */
function extractDimensions(data: any): string | undefined {
  if (!data.dimension) return undefined;

  const dims = Array.isArray(data.dimension) ? data.dimension : [data.dimension];
  const height = dims.find((d: any) =>
    d.classified_as?.[0]?._label?.toLowerCase().includes('height')
  );
  const width = dims.find((d: any) =>
    d.classified_as?.[0]?._label?.toLowerCase().includes('width')
  );

  if (height?.value && width?.value) {
    const unit = height.unit?._label || 'cm';
    return `${height.value} × ${width.value} ${unit}`;
  }

  return undefined;
}

/**
 * Extract medium/materials
 */
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

/**
 * Generate numeric ID from URL
 */
function generateIdFromUrl(url: string): string {
  const match = url.match(/([^\/]+)$/);
  return match ? match[1] : Date.now().toString();
}

/**
 * Get popular Rijksmuseum artists
 */
export function getPopularRijksmuseumArtists(): string[] {
  return [
    'Rembrandt van Rijn',
    'Johannes Vermeer',
    'Frans Hals',
    'Jan Steen',
    'Vincent van Gogh',
  ];
}

function generateColorFromString(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#95E1D3', '#F38181',
    '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#E8B86D',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}