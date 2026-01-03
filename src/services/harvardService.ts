import type { Painting } from '@/types/painting';

import Config from 'react-native-config';

import { cleanArtistName } from './searchHelpers';

const HARVARD_API_BASE = 'https://api.harvardartmuseums.org/v1';
// Get free API key from: https://harvardartmuseums.org/collections/api
const API_KEY = Config.HARVARD_API_KEY; // TODO: Move to config/env

type HarvardSearchParameters = {
  page?: number;
  query: string;
  size?: number;
}

type HarvardSearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Harvard Art Museums collection
 */
export async function searchHarvard(
  parameters: HarvardSearchParameters
): Promise<HarvardSearchResult> {
  try {
    const { page = 1, query, size = 20 } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Use the correct endpoint: /object (not /v1/object)
    const queryParameters = new URLSearchParams({
      apikey: API_KEY,
      classification: 'Paintings',
      hasimage: '1',
      page: page.toString(),
      q: query.trim(),
      size: size.toString(),
    });

    const url = `${HARVARD_API_BASE}/object?${queryParameters.toString()}`;
    console.log('🏛️ Searching Harvard Art Museums:', url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Harvard API key');
      }
      if (response.status === 429) {
        console.warn('Harvard API rate limit reached');
        return { paintings: [], totalResults: 0 };
      }
      throw new Error(`Harvard API error: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records || [];
    const info = data.info || {};

    const paintings = records
      .map((object: any) => parseHarvardObject(object))
      .filter((p: null | Painting) => p !== null) as Painting[];

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
function parseHarvardObject(object: any): null | Painting {
  try {
    const title = object.title || 'Untitled';

    // Extract and clean artist
    const artistDisplay = object.people?.[0]?.name ||
                          object.culture ||
                          'Unknown Artist';
    const artist = cleanArtistName(artistDisplay);

    // Image URLs
    const imageId = object.primaryimageurl;
    if (!imageId) return null;

    const imageUrl = imageId;
    const thumbnailUrl = imageId.includes('?')
      ? `${imageId}&height=400`
      : `${imageId}?height=400`;

    // Extract year
    let year: number | undefined;
    if (object.dated) {
      const match = object.dated.match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (object.culture) descParts.push(object.culture);
    if (object.period) descParts.push(object.period);
    if (object.technique) descParts.push(object.technique);

    // Extract color
    const color = object.colors && object.colors.length > 0
      ? `#${object.colors[0].color}`
      : generateColorFromString(title);

    return {
      artist,
      color,
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      dimensions: object.dimensions || undefined,
      id: `harvard-${object.id}`,
      imageUrl,
      isSeen: false,
      location: 'Cambridge, Massachusetts, USA',
      medium: object.medium || undefined,
      museum: 'Harvard Art Museums',
      thumbnailUrl,
      title,
      wantToVisit: false,
      year,
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