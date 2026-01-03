import type { Painting } from '@/types/painting';

const VA_API_BASE = 'https://api.vam.ac.uk/v2/objects/search';

type VASearchParameters = {
  page?: number;
  pageSize?: number;
  query: string;
}

type VASearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Victoria and Albert Museum collection
 */
export async function searchVA(
  parameters: VASearchParameters
): Promise<VASearchResult> {
  try {
    const { page = 1, pageSize = 30, query } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // V&A uses a different query structure
    const queryParameters = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      q: query.trim(),
      // Filter for items with images and paintings
      images_exist: 'true',
      q_object_type: 'painting',
    });

    const url = `${VA_API_BASE}?${queryParameters.toString()}`;
    console.log('🏛️ Searching Victoria & Albert Museum:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`V&A API error: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records || [];
    const info = data.info || {};

    const paintings = records
      .map((object: any) => parseVAObject(object))
      .filter((p: null | Painting) => p !== null) as Painting[];

    return {
      paintings,
      totalResults: info.record_count || paintings.length,
    };
  } catch (error) {
    console.error('Error searching V&A Museum:', error);
    throw error;
  }
}

/**
 * Parse V&A object into Painting format
 */
function parseVAObject(object: any): null | Painting {
  try {
    // V&A uses _primaryTitle for the main title
    const title = object._primaryTitle || object.objectType || 'Untitled';

    // Extract artist
    const artist = object._primaryMaker?.name ||
                   object._primaryMaker?.association ||
                   'Unknown Artist';

    // V&A uses IIIF for images
    const images = object._images;
    if (!images?._iiif_image_base_url) return null;

    // Construct image URLs using IIIF
    const baseUrl = images._iiif_image_base_url;
    const imageUrl = `${baseUrl}/full/!800,800/0/default.jpg`;
    const thumbnailUrl = images._primary_thumbnail ||
                        `${baseUrl}/full/!400,400/0/default.jpg`;

    // Extract year
    let year: number | undefined;
    if (object._primaryDate) {
      const match = object._primaryDate.toString().match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (object._primaryPlace) descParts.push(object._primaryPlace);
    if (object.objectType) descParts.push(object.objectType);
    if (object.physicalDescription) descParts.push(object.physicalDescription);

    return {
      artist,
      color: generateColorFromString(title),
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      dimensions: object.dimensionsNote || undefined,
      id: `va-${object.systemNumber}`,
      imageUrl,
      isSeen: false,
      location: 'London, United Kingdom',
      medium: object.materialsAndTechniques || undefined,
      museum: 'Victoria and Albert Museum',
      thumbnailUrl,
      title,
      wantToVisit: false,
      year,
    };
  } catch (error) {
    console.error('Error parsing V&A object:', error);
    return null;
  }
}

/**
 * Get popular artists/items in V&A collection
 */
export function getPopularVAArtists(): string[] {
  return [
    'John Constable',
    'J.M.W. Turner',
    'Raphael',
    'Giovanni Battista Tiepolo',
    'Joshua Reynolds',
    'Thomas Gainsborough',
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