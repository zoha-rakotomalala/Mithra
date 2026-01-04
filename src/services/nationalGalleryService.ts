import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';

const NG_SEARCH_API = 'https://data.ng.ac.uk/search';
const NG_DATA_BASE = 'https://data.ng.ac.uk';

interface NGSearchParams {
  query: string;
  limit?: number;
}

interface NGSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search National Gallery (UK) collection using Linked Art
 */
export async function searchNationalGallery(
  params: NGSearchParams
): Promise<NGSearchResult> {
  try {
    const { query, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Search via their Elasticsearch API
    const searchParams = new URLSearchParams({
      q: query.trim(),
      size: limit.toString(),
      _source: 'id,title,creator,date,image',
    });

    const searchUrl = `${NG_SEARCH_API}?${searchParams.toString()}`;
    console.log('🇬🇧 Searching National Gallery:', searchUrl);

    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.warn(`National Gallery search error: ${response.status}`);
      return { paintings: [], totalResults: 0 };
    }

    const data = await response.json();
    const hits = data.hits?.hits || [];
    const total = data.hits?.total?.value || 0;

    // Fetch Linked Art data for each result
    const paintings = await Promise.all(
      hits.map((hit: any) => fetchLinkedArtObject(hit._source?.id || hit._id))
    );

    return {
      paintings: paintings.filter((p): p is Painting => p !== null),
      totalResults: total,
    };
  } catch (error) {
    console.error('Error searching National Gallery:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Fetch Linked Art JSON for a specific object
 */
async function fetchLinkedArtObject(pid: string): Promise<Painting | null> {
  try {
    // Fetch Linked Art representation
    // Format: https://data.ng.ac.uk/{PID}.json
    const url = `${NG_DATA_BASE}/${pid}.json`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/ld+json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch NG object ${pid}`);
      return null;
    }

    const data = await response.json();
    return parseNGLinkedArt(data);
  } catch (error) {
    console.error(`Error fetching NG object ${pid}:`, error);
    return null;
  }
}

/**
 * Parse National Gallery Linked Art format into Painting
 */
function parseNGLinkedArt(data: any): Painting | null {
  try {
    // Extract title
    const title = extractTitle(data);
    if (!title) return null;

    // Extract artist
    const artistDisplay = extractArtist(data);
    const artist = cleanArtistName(artistDisplay);

    // Extract image
    const imageUrl = extractImage(data);
    if (!imageUrl) return null;

    // Extract year
    const year = extractYear(data);

    // Extract dimensions and medium
    const dimensions = extractDimensions(data);
    const medium = extractMedium(data);

    // Extract description
    const description = extractDescription(data);

    return {
      id: `ng-${extractId(data)}`,
      title,
      artist,
      year,
      medium,
      dimensions,
      museum: 'National Gallery',
      location: 'London, United Kingdom',
      description,
      imageUrl,
      thumbnailUrl: imageUrl, // NG uses IIIF, can add /full/400,/ for thumbnail
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing NG Linked Art:', error);
    return null;
  }
}

/**
 * Extract title from Linked Art
 */
function extractTitle(data: any): string | undefined {
  if (data._label) return data._label;

  const names = data.identified_by || [];
  const title = names.find((item: any) =>
    item.type === 'Name' &&
    (item.classified_as?.[0]?._label === 'Primary Name' || !item.classified_as)
  );

  return title?.content || 'Untitled';
}

/**
 * Extract artist from Linked Art
 */
function extractArtist(data: any): string {
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
  const timespan = data.produced_by?.timespan;
  if (!timespan) return undefined;

  // Try various date fields
  if (timespan.begin_of_the_begin) {
    const match = timespan.begin_of_the_begin.match(/\d{4}/);
    if (match) return parseInt(match[0]);
  }

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
 * Extract image URL from Linked Art
 */
function extractImage(data: any): string | undefined {
  if (data.representation) {
    const reps = Array.isArray(data.representation)
      ? data.representation
      : [data.representation];

    // Look for digital representation
    for (const rep of reps) {
      if (rep.access_point?.[0]?.id) {
        return rep.access_point[0].id;
      }
      if (rep.digitally_shown_by?.[0]?.access_point?.[0]?.id) {
        return rep.digitally_shown_by[0].access_point[0].id;
      }
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
  const height = dims.find((d: any) => d.classified_as?.[0]?._label?.toLowerCase().includes('height'));
  const width = dims.find((d: any) => d.classified_as?.[0]?._label?.toLowerCase().includes('width'));

  if (height?.value && width?.value) {
    const unit = height.unit?._label || 'cm';
    return `${height.value} × ${width.value} ${unit}`;
  }

  return undefined;
}

/**
 * Extract medium/technique
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
 * Extract description
 */
function extractDescription(data: any): string | undefined {
  if (data.referred_to_by) {
    const refs = Array.isArray(data.referred_to_by)
      ? data.referred_to_by
      : [data.referred_to_by];

    const desc = refs.find((ref: any) =>
      ref.type === 'LinguisticObject' && ref.content
    );

    return desc?.content;
  }
  return undefined;
}

/**
 * Extract ID from Linked Art object
 */
function extractId(data: any): string {
  const id = data.id || data['@id'] || '';
  const match = id.match(/([^\/]+)(?:\.json)?$/);
  return match ? match[1] : Date.now().toString();
}

/**
 * Get popular National Gallery artists
 */
export function getPopularNGArtists(): string[] {
  return [
    'J.M.W. Turner',
    'John Constable',
    'Leonardo da Vinci',
    'Rembrandt',
    'Vincent van Gogh',
    'Claude Monet',
    'Titian',
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