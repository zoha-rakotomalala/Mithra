import type { Painting } from '@/types/painting';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const CMA_API_BASE = 'https://openaccess-api.clevelandart.org/api/artworks';

type ClevelandSearchParameters = {
  limit?: number;
  query: string;
  skip?: number;
};

type ClevelandSearchResult = {
  paintings: Painting[];
  totalResults: number;
};

/**
 * Search Cleveland Museum of Art collection
 */
export async function searchCleveland(
  parameters: ClevelandSearchParameters,
): Promise<ClevelandSearchResult> {
  try {
    const { limit = 30, query, skip = 0 } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParameters = new URLSearchParams({
      has_image: '1',
      limit: limit.toString(),
      q: query.trim(),
      skip: skip.toString(),
      type: 'Painting',
    });

    const url = `${CMA_API_BASE}?${queryParameters.toString()}`;
    console.log('🎨 Searching Cleveland Museum:', url);

    const data = await museumApi.get(url).json<any>();
    const artworks = data.data || [];
    const info = data.info || {};

    const paintings = artworks
      .map((object: any) => parseClevelandObject(object))
      .filter((p: null | Painting) => p !== null) as Painting[];

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
function extractArtist(object: any): string {
  if (object.creators && object.creators.length > 0) {
    const creator = object.creators[0];
    return creator.description || creator.name || 'Unknown Artist';
  }
  if (object.culture && object.culture.length > 0) {
    return object.culture[0];
  }
  return 'Unknown Artist';
}

function parseClevelandObject(object: any): null | Painting {
  try {
    const title = object.title || 'Untitled';
    const artist = extractArtist(object);

    // Image URLs
    const images = object.images?.web || {};
    const imageUrl = images.url || '';
    if (!imageUrl) return null;

    // Cleveland provides a thumbnail URL
    const thumbnailUrl = object.images?.print?.url || imageUrl;

    // Extract year
    let year: number | undefined;
    if (object.creation_date) {
      const match = object.creation_date.match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (object.culture && object.culture.length > 0) {
      descParts.push(object.culture.join(', '));
    }
    if (object.technique) {
      descParts.push(object.technique);
    }
    if (object.tombstone) {
      descParts.push(object.tombstone);
    }

    return {
      artist,
      color: generateColorFromString(title),
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      dimensions: object.measurements || undefined,
      id: `cleveland-${object.id}`,
      imageUrl,
      isSeen: false,
      location: 'Cleveland, Ohio, USA',
      medium: object.technique || undefined,
      museum: 'Cleveland Museum of Art',
      thumbnailUrl,
      title,
      wantToVisit: false,
      year,
    };
  } catch (error) {
    console.error('Error parsing Cleveland object:', error);
    return null;
  }
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

import type {
  MuseumServiceAdapter,
  MuseumSearchParams,
  MuseumSearchResult,
} from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const clevelandAdapter: MuseumServiceAdapter = {
  museumId: 'CLEVELAND',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchCleveland({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(clevelandAdapter);
