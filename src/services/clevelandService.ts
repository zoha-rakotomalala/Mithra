import type { Painting } from '@/types/painting';

const CMA_API_BASE = 'https://openaccess-api.clevelandart.org/api/artworks';

interface ClevelandSearchParams {
  query: string;
  limit?: number;
  skip?: number;
}

interface ClevelandSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Cleveland Museum of Art collection
 */
export async function searchCleveland(
  params: ClevelandSearchParams
): Promise<ClevelandSearchResult> {
  try {
    const { query, limit = 30, skip = 0 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      q: query.trim(),
      has_image: '1',
      type: 'Painting',
      limit: limit.toString(),
      skip: skip.toString(),
    });

    const url = `${CMA_API_BASE}?${queryParams.toString()}`;
    console.log('🎨 Searching Cleveland Museum:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Cleveland API error: ${response.status}`);
    }

    const data = await response.json();
    const artworks = data.data || [];
    const info = data.info || {};

    const paintings = artworks
      .map((obj: any) => parseClevelandObject(obj))
      .filter((p: Painting | null) => p !== null) as Painting[];

    return {
      paintings,
      totalResults: info.total || paintings.length,
    };
  } catch (error) {
    console.error('Error searching Cleveland Museum:', error);
    throw error;
  }
}

/**
 * Parse Cleveland Museum object into Painting format
 */
function parseClevelandObject(obj: any): Painting | null {
  try {
    const title = obj.title || 'Untitled';
    const artist = extractArtist(obj);

    // Image URLs
    const images = obj.images?.web || {};
    const imageUrl = images.url || '';
    if (!imageUrl) return null;

    // Cleveland provides a thumbnail URL
    const thumbnailUrl = obj.images?.print?.url || imageUrl;

    // Extract year
    let year: number | undefined;
    if (obj.creation_date) {
      const match = obj.creation_date.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (obj.culture && obj.culture.length > 0) {
      descParts.push(obj.culture.join(', '));
    }
    if (obj.technique) {
      descParts.push(obj.technique);
    }
    if (obj.tombstone) {
      descParts.push(obj.tombstone);
    }

    return {
      id: `cleveland-${obj.id}`,
      title,
      artist,
      year,
      medium: obj.technique || undefined,
      dimensions: obj.measurements || undefined,
      museum: 'Cleveland Museum of Art',
      location: 'Cleveland, Ohio, USA',
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Cleveland object:', error);
    return null;
  }
}

function extractArtist(obj: any): string {
  if (obj.creators && obj.creators.length > 0) {
    const creator = obj.creators[0];
    return creator.description || creator.name || 'Unknown Artist';
  }
  if (obj.culture && obj.culture.length > 0) {
    return obj.culture[0];
  }
  return 'Unknown Artist';
}

/**
 * Get popular artists in Cleveland collection
 */
export function getPopularClevelandArtists(): string[] {
  return [
    'Pablo Picasso',
    'Claude Monet',
    'Pierre-Auguste Renoir',
    'Paul Cézanne',
    'Edgar Degas',
    'Rembrandt',
    'El Greco',
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