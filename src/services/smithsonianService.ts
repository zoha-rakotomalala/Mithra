import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import Config from 'react-native-config';
import { museumApi } from './museumApiClient';

const SMITHSONIAN_API_BASE = 'https://api.si.edu/openaccess/api/v1.0/search';
const API_KEY = Config.SMITHSONIAN_API_KEY;

interface SmithsonianSearchParams {
  query: string;
  limit?: number;
}

interface SmithsonianSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Smithsonian Institution collection
 */
export async function searchSmithsonian(
  params: SmithsonianSearchParams
): Promise<SmithsonianSearchResult> {
  try {
    const { query, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      q: query.trim(),
      api_key: API_KEY || 'DEMO_KEY',
      rows: limit.toString(),
      start: '0',
    });
    // Multiple fq params for filtering
    queryParams.append('fq', 'online_media_type:"Images"');
    queryParams.append('fq', 'type:"edanmdm"');

    const url = `${SMITHSONIAN_API_BASE}?${queryParams.toString()}`;
    console.log('🇺🇸 Searching Smithsonian:', url);

    const data = await museumApi.get(url).json<any>();
    const rows = data.response?.rows || [];
    const totalResults = data.response?.rowCount || 0;

    const paintings = rows
      .map((row: any) => parseSmithsonianObject(row))
      .filter((p: Painting | null) => p !== null) as Painting[];

    return { paintings, totalResults };
  } catch (error) {
    console.error('Error searching Smithsonian:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse Smithsonian object into Painting format
 */
function parseSmithsonianObject(row: any): Painting | null {
  try {
    const content = row.content;
    const title = content?.descriptiveNonRepeating?.title?.content || row.title || 'Untitled';

    // freetext.name entries have { label: 'Artist' | 'Sitter' | ..., content: 'Name' }
    const freetextNames = content?.freetext?.name || [];
    const artistEntry = freetextNames.find((n: any) =>
      n.label === 'Artist' || n.label === 'Maker' || n.label === 'Creator'
    ) || freetextNames.find((n: any) => n.label === 'Author');
    const artistRaw = artistEntry?.content
      || (Array.isArray(content?.indexedStructured?.name) ? content.indexedStructured.name[0] : content?.indexedStructured?.name)
      || 'Unknown Artist';
    const artist = cleanArtistName(typeof artistRaw === 'string' ? artistRaw : 'Unknown Artist');

    const media = content?.descriptiveNonRepeating?.online_media?.media;
    const imageUrl = media?.[0]?.content;
    if (!imageUrl) return null;

    const thumbnailUrl = media?.[0]?.thumbnail || imageUrl;

    let year: number | undefined;
    const dateStr = content?.freetext?.date?.[0]?.content;
    if (dateStr) {
      const match = dateStr.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    const medium = content?.freetext?.physicalDescription?.[0]?.content;
    const museumName = content?.freetext?.setName?.[0]?.content || 'Smithsonian Institution';
    const places = content?.indexedStructured?.place || [];

    return {
      id: `smithsonian-${row.id}`,
      title,
      artist,
      year,
      medium,
      dimensions: undefined,
      museum: museumName,
      location: places[0] || 'Washington, D.C., USA',
      description: undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Smithsonian object:', error);
    return null;
  }
}

import type { MuseumServiceAdapter, MuseumSearchParams, MuseumSearchResult } from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const smithsonianAdapter: MuseumServiceAdapter = {
  museumId: 'SMITHSONIAN',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchSmithsonian({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(smithsonianAdapter);
