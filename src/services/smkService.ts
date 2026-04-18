import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const SMK_API_BASE = 'https://api.smk.dk/api/v1/art/search/';

interface SMKSearchParams {
  query: string;
  limit?: number;
}

interface SMKSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search SMK (National Gallery of Denmark) collection
 */
export async function searchSMK(
  params: SMKSearchParams,
): Promise<SMKSearchResult> {
  try {
    const { query, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      keys: query.trim(),
      offset: '0',
      rows: limit.toString(),
      has_image: 'true',
    });

    const url = `${SMK_API_BASE}?${queryParams.toString()}`;
    console.log('🇩🇰 Searching SMK:', url);

    const data = await museumApi.get(url).json<any>();
    const items = data.items || [];
    const totalResults = data.found || 0;

    const paintings = items
      .map((item: any) => parseSMKObject(item))
      .filter((p: Painting | null) => p !== null) as Painting[];

    return { paintings, totalResults };
  } catch (error) {
    console.error('Error searching SMK:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse SMK object into Painting format
 */
function parseSMKObject(item: any): Painting | null {
  try {
    const title = item.titles?.[0]?.title || 'Untitled';
    const artistRaw = item.production?.[0]?.creator || 'Unknown Artist';
    const artist = cleanArtistName(artistRaw);

    const imageUrl = item.image_native || item.image_thumbnail;
    if (!imageUrl) return null;

    const thumbnailUrl = item.image_thumbnail || imageUrl;

    let year: number | undefined;
    if (item.production_date?.[0]?.period) {
      const match = item.production_date[0].period.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    const techniques = item.techniques || [];
    const medium = techniques.length > 0 ? techniques.join(', ') : undefined;

    let dimensions: string | undefined;
    if (item.dimensions?.length) {
      dimensions = item.dimensions
        .map((d: any) => `${d.value} ${d.unit} (${d.type})`)
        .join(', ');
    }

    return {
      id: `smk-${item.object_number}`,
      title,
      artist,
      year,
      medium,
      dimensions,
      museum: 'SMK — National Gallery of Denmark',
      location: 'Copenhagen, Denmark',
      description: undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing SMK object:', error);
    return null;
  }
}

import type {
  MuseumServiceAdapter,
  MuseumSearchParams,
  MuseumSearchResult,
} from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const smkAdapter: MuseumServiceAdapter = {
  museumId: 'SMK',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchSMK({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(smkAdapter);
