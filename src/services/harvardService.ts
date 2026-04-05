import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import Config from 'react-native-config';
import { museumApi } from './museumApiClient';

const HARVARD_API_BASE = 'https://api.harvardartmuseums.org';
// Get free API key from: https://harvardartmuseums.org/collections/api
const API_KEY = Config.HARVARD_API_KEY; // TODO: Move to config/env

interface HarvardSearchParams {
  query: string;
  page?: number;
  size?: number;
}

interface HarvardSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Harvard Art Museums collection
 */
export async function searchHarvard(
  params: HarvardSearchParams
): Promise<HarvardSearchResult> {
  try {
    const { query, page = 1, size = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Use the correct endpoint: /object (not /v1/object)
    const queryParams = new URLSearchParams({
      apikey: API_KEY || "",
      q: query.trim(),
      classification: 'Paintings',
      hasimage: '1',
      page: page.toString(),
      size: size.toString(),
    });

    const url = `${HARVARD_API_BASE}/object?${queryParams.toString()}`;
    console.log('🏛️ Searching Harvard Art Museums:', url);

    const data = await museumApi.get(url).json<any>();
    const records = data.records || [];
    const info = data.info || {};

    const paintings = records
      .map((obj: any) => parseHarvardObject(obj))
      .filter((p: Painting | null) => p !== null) as Painting[];

    return {
      paintings,
      totalResults: info.totalrecords || paintings.length,
    };
  } catch (error) {
    console.error('Error searching Harvard Art Museums:', error);
    // Don't throw - return empty results so other museums can still work
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse Harvard object into Painting format
 */
function parseHarvardObject(obj: any): Painting | null {
  try {
    const title = obj.title || 'Untitled';

    // Extract and clean artist
    const artistDisplay = obj.people?.[0]?.name ||
                          obj.culture ||
                          'Unknown Artist';
    const artist = cleanArtistName(artistDisplay);

    // Image URLs — use primaryimageurl directly (nrs.harvard.edu); ids.lib.harvard.edu aggressively rate-limits (429)
    const imageUrl = obj.primaryimageurl;
    if (!imageUrl) return null;
    const thumbnailUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'height=400&width=400';

    // Extract year
    let year: number | undefined;
    if (obj.dated) {
      const match = obj.dated.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (obj.culture) descParts.push(obj.culture);
    if (obj.period) descParts.push(obj.period);
    if (obj.technique) descParts.push(obj.technique);

    // Extract color
    const color = obj.colors && obj.colors.length > 0
      ? `#${obj.colors[0].color}`
      : generateColorFromString(title);

    return {
      id: `harvard-${obj.id}`,
      title,
      artist,
      year,
      medium: obj.medium || undefined,
      dimensions: obj.dimensions || undefined,
      museum: 'Harvard Art Museums',
      location: 'Cambridge, Massachusetts, USA',
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      imageUrl,
      thumbnailUrl,
      color,
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Harvard object:', error);
    return null;
  }
}

/**
 * Get popular artists in Harvard collection
 */
export function getPopularHarvardArtists(): string[] {
  return [
    'Rembrandt van Rijn',
    'Pablo Picasso',
    'Claude Monet',
    'Vincent van Gogh',
    'Albrecht Dürer',
    'Edgar Degas',
  ];
}



import type { MuseumServiceAdapter, MuseumSearchParams, MuseumSearchResult } from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const harvardAdapter: MuseumServiceAdapter = {
  museumId: 'HARVARD',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchHarvard({
      query: params.query,
      size: params.maxResults,
    });
  },
};

registerAdapter(harvardAdapter);
