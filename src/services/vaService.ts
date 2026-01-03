import type { Painting } from '@/types/painting';

const VA_API_BASE = 'https://api.vam.ac.uk/v2/objects/search';

interface VASearchParams {
  query: string;
  page?: number;
  pageSize?: number;
}

interface VASearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Victoria and Albert Museum collection
 */
export async function searchVA(
  params: VASearchParams
): Promise<VASearchResult> {
  try {
    const { query, page = 1, pageSize = 30 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // V&A uses a different query structure
    const queryParams = new URLSearchParams({
      q: query.trim(),
      page: page.toString(),
      page_size: pageSize.toString(),
      // Filter for items with images and paintings
      images_exist: 'true',
      q_object_type: 'painting',
    });

    const url = `${VA_API_BASE}?${queryParams.toString()}`;
    console.log('🏛️ Searching Victoria & Albert Museum:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`V&A API error: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records || [];
    const info = data.info || {};

    const paintings = records
      .map((obj: any) => parseVAObject(obj))
      .filter((p: Painting | null) => p !== null) as Painting[];

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
function parseVAObject(obj: any): Painting | null {
  try {
    // V&A uses _primaryTitle for the main title
    const title = obj._primaryTitle || obj.objectType || 'Untitled';

    // Extract artist
    const artist = obj._primaryMaker?.name ||
                   obj._primaryMaker?.association ||
                   'Unknown Artist';

    // V&A uses IIIF for images
    const images = obj._images;
    if (!images || !images._iiif_image_base_url) return null;

    // Construct image URLs using IIIF
    const baseUrl = images._iiif_image_base_url;
    const imageUrl = `${baseUrl}/full/!800,800/0/default.jpg`;
    const thumbnailUrl = images._primary_thumbnail ||
                        `${baseUrl}/full/!400,400/0/default.jpg`;

    // Extract year
    let year: number | undefined;
    if (obj._primaryDate) {
      const match = obj._primaryDate.toString().match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (obj._primaryPlace) descParts.push(obj._primaryPlace);
    if (obj.objectType) descParts.push(obj.objectType);
    if (obj.physicalDescription) descParts.push(obj.physicalDescription);

    return {
      id: `va-${obj.systemNumber}`,
      title,
      artist,
      year,
      medium: obj.materialsAndTechniques || undefined,
      dimensions: obj.dimensionsNote || undefined,
      museum: 'Victoria and Albert Museum',
      location: 'London, United Kingdom',
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
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