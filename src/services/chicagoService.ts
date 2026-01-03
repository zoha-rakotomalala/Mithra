import type { Painting } from '@/types/painting';

import { cleanArtistName } from './searchHelpers';

const AIC_API_BASE = 'https://api.artic.edu/api/v1';
const AIC_IMAGE_BASE = 'https://www.artic.edu/iiif/2';

type ChicagoSearchParameters = {
  limit?: number;
  page?: number;
  query: string;
}

type ChicagoSearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Art Institute of Chicago collection
 */
export async function searchChicago(
  parameters: ChicagoSearchParameters
): Promise<ChicagoSearchResult> {
  try {
    const { limit = 20, page = 1, query } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParameters = new URLSearchParams({
      fields: 'id,title,artist_display,date_display,medium_display,dimensions,image_id,thumbnail,color',
      limit: limit.toString(),
      page: page.toString(),
      q: query.trim(),
    });

    const url = `${AIC_API_BASE}/artworks/search?${queryParameters.toString()}`;
    console.log('🏛️ Searching Art Institute of Chicago:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Chicago API error: ${response.status}`);
    }

    const data = await response.json();
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

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch Chicago artworks batch`);
      return [];
    }

    const data = await response.json();
    const artworks = data.data || [];

    return artworks
      .map((object: any) => parseChicagoObject(object))
      .filter((p: null | Painting) => p !== null) as Painting[];
  } catch (error) {
    console.error('Error fetching Chicago artworks batch:', error);
    return [];
  }
}

/**
 * Parse Chicago object into Painting format
 */
function parseChicagoObject(object: any): null | Painting {
  try {
    const title = object.title || 'Untitled';

    // Extract and clean artist
    const artistDisplay = object.artist_display || 'Unknown Artist';
    const artist = cleanArtistName(artistDisplay);

    // FIXED: Chicago uses IIIF for images - need proper image_id
    const imageId = object.image_id;
    if (!imageId) {
      console.log(`No image for Chicago artwork: ${title}`);
      return null; // Skip artworks without images
    }

    // Construct proper IIIF URLs
    const imageUrl = `${AIC_IMAGE_BASE}/${imageId}/full/843,/0/default.jpg`;
    const thumbnailUrl = `${AIC_IMAGE_BASE}/${imageId}/full/400,/0/default.jpg`;

    // Extract year from date_display
    let year: number | undefined;
    if (object.date_display) {
      const match = object.date_display.match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    }

    // Use color data if available
    const color = object.color?.h
      ? `hsl(${object.color.h}, ${object.color.s}%, ${object.color.l}%)`
      : generateColorFromString(title);

    return {
      artist,
      color,
      description: object.thumbnail?.alt_text || undefined,
      dimensions: object.dimensions || undefined,
      id: `chicago-${object.id}`,
      imageUrl,
      isSeen: false,
      location: 'Chicago, Illinois, USA',
      medium: object.medium_display || undefined,
      museum: 'Art Institute of Chicago',
      thumbnailUrl,
      title,
      wantToVisit: false,
      year,
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

function generateColorFromString(string_: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#95E1D3', '#F38181',
    '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#E8B86D',
  ];
  let hash = 0;
  for (let index = 0; index < string_.length; index++) {
    hash = string_.charCodeAt(index) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}