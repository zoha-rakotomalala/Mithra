import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const AIC_API_BASE = 'https://api.artic.edu/api/v1';
const AIC_IMAGE_BASE = 'https://www.artic.edu/iiif/2';

interface ChicagoSearchParams {
  query: string;
  page?: number;
  limit?: number;
}

interface ChicagoSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Art Institute of Chicago collection
 */
export async function searchChicago(
  params: ChicagoSearchParams
): Promise<ChicagoSearchResult> {
  try {
    const { query, page = 1, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      q: query.trim(),
      page: page.toString(),
      limit: limit.toString(),
      fields: 'id,title,artist_display,date_display,medium_display,dimensions,image_id,thumbnail,color',
    });

    const url = `${AIC_API_BASE}/artworks/search?${queryParams.toString()}`;
    console.log('🏛️ Searching Art Institute of Chicago:', url);

    const data = await museumApi.get(url).json<any>();
    const artworkIds = data.data || [];
    const pagination = data.pagination || {};

    // Fetch full artwork details
    if (artworkIds.length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Fetch artworks in batch
    const paintings = await fetchArtworksBatch(artworkIds.map((item: any) => item.id));

    return {
      paintings,
      totalResults: pagination.total || paintings.length,
    };
  } catch (error) {
    console.error('Error searching Art Institute of Chicago:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Fetch multiple artworks by ID
 */
async function fetchArtworksBatch(ids: number[]): Promise<Painting[]> {
  try {
    // AIC allows fetching multiple artworks with comma-separated IDs
    const idsParam = ids.slice(0, 20).join(',');
    const url = `${AIC_API_BASE}/artworks?ids=${idsParam}&fields=id,title,artist_display,date_display,medium_display,dimensions,image_id,thumbnail,color,classification_title,is_public_domain`;

    const data = await museumApi.get(url).json<any>();
    const artworks = data.data || [];

    return artworks
      .map((obj: any) => parseChicagoObject(obj))
      .filter((p: Painting | null) => p !== null) as Painting[];
  } catch (error) {
    console.error('Error fetching Chicago artworks batch:', error);
    return [];
  }
}

/**
 * Parse Chicago object into Painting format
 */
function parseChicagoObject(obj: any): Painting | null {
  try {
    const title = obj.title || 'Untitled';

    // Extract and clean artist
    const artistDisplay = obj.artist_display || 'Unknown Artist';
    const artist = cleanArtistName(artistDisplay);

    // FIXED: Chicago uses IIIF for images - need proper image_id
    const imageId = obj.image_id;
    if (!imageId) {
      console.log(`No image for Chicago artwork: ${title}`);
      return null; // Skip artworks without images
    }

    // Construct proper IIIF URLs
    const imageUrl = `${AIC_IMAGE_BASE}/${imageId}/full/843,/0/default.jpg`;
    const thumbnailUrl = `${AIC_IMAGE_BASE}/${imageId}/full/400,/0/default.jpg`;

    // Extract year from date_display
    let year: number | undefined;
    if (obj.date_display) {
      const match = obj.date_display.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Use color data if available
    const color = obj.color?.h
      ? `hsl(${obj.color.h}, ${obj.color.s}%, ${obj.color.l}%)`
      : generateColorFromString(title);

    return {
      id: `chicago-${obj.id}`,
      title,
      artist,
      year,
      medium: obj.medium_display || undefined,
      dimensions: obj.dimensions || undefined,
      museum: 'Art Institute of Chicago',
      location: 'Chicago, Illinois, USA',
      description: obj.thumbnail?.alt_text || undefined,
      imageUrl,
      thumbnailUrl,
      color,
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Chicago object:', error);
    return null;
  }
}

/**
 * Get popular artists in Chicago collection
 */
export function getPopularChicagoArtists(): string[] {
  return [
    'Claude Monet',
    'Vincent van Gogh',
    'Pablo Picasso',
    'Georges Seurat',
    'Paul Cézanne',
    'Henri de Toulouse-Lautrec',
    'Pierre-Auguste Renoir',
    'Édouard Manet',
  ];
}



import type { MuseumServiceAdapter, MuseumSearchParams, MuseumSearchResult } from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const chicagoAdapter: MuseumServiceAdapter = {
  museumId: 'CHICAGO',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchChicago({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(chicagoAdapter);
