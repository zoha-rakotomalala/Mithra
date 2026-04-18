import type { Painting } from '@/types/painting';
import { generateColorFromString } from '@/utils/colorGenerator';
import Config from 'react-native-config';
import { museumApi } from './museumApiClient';

const EUROPEANA_API_BASE = 'https://api.europeana.eu/record/v2';
const API_KEY = Config.EUROPEANA_API_KEY;

interface EuropeanaSearchParams {
  query: string;
  page?: number;
  rows?: number;
}

interface EuropeanaSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Europeana collection (50M+ objects from European cultural institutions)
 */
export async function searchEuropeana(
  params: EuropeanaSearchParams,
): Promise<EuropeanaSearchResult> {
  try {
    const { query, page = 1, rows = 30 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      wskey: API_KEY || '',
      query: query.trim(),
      qf: 'what:painting', // Focus on paintings
      media: 'true', // Must have media
      start: ((page - 1) * rows + 1).toString(),
      rows: rows.toString(),
      profile: 'rich', // Get full metadata
    });

    const url = `${EUROPEANA_API_BASE}/search.json?${queryParams.toString()}`;
    console.log('🇪🇺 Searching Europeana:', url);

    const data = await museumApi.get(url).json<any>();

    if (!data.success) {
      throw new Error(data.error || 'Europeana search failed');
    }

    const items = data.items || [];
    const totalResults = data.totalResults || 0;

    const paintings = items
      .map((item: any) => parseEuropeanaObject(item))
      .filter((p: Painting | null) => p !== null) as Painting[];

    return {
      paintings,
      totalResults,
    };
  } catch (error) {
    console.error('Error searching Europeana:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse Europeana object into Painting format
 */
function parseEuropeanaObject(item: any): Painting | null {
  try {
    // Extract title (can be array or string)
    const titleRaw = item.title || item.dcTitle;
    const title = Array.isArray(titleRaw)
      ? titleRaw[0]
      : titleRaw || 'Untitled';

    // Extract artist/creator
    const creatorRaw = item.dcCreator;
    const artist = Array.isArray(creatorRaw)
      ? creatorRaw[0]
      : creatorRaw || 'Unknown Artist';

    // Extract image URL
    const edmIsShownBy = item.edmIsShownBy;
    const edmPreview = item.edmPreview;

    if (!edmPreview && !edmIsShownBy) return null;

    // Use high-res if available, otherwise preview
    const imageUrl = Array.isArray(edmIsShownBy)
      ? edmIsShownBy[0]
      : edmIsShownBy || edmPreview;

    const thumbnailUrl = Array.isArray(edmPreview)
      ? edmPreview[0]
      : edmPreview || imageUrl;

    // Extract year
    let year: number | undefined;
    const yearRaw = item.year || item.edmTimespanLabel;
    if (yearRaw) {
      const yearStr = Array.isArray(yearRaw) ? yearRaw[0] : yearRaw;
      const match = yearStr.toString().match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Extract contributing institution
    const dataProvider = Array.isArray(item.dataProvider)
      ? item.dataProvider[0]
      : item.dataProvider || 'European Institution';

    // Build description
    const descParts: string[] = [];
    if (item.dcDescription) {
      const desc = Array.isArray(item.dcDescription)
        ? item.dcDescription[0]
        : item.dcDescription;
      descParts.push(desc);
    }
    if (item.dcType) {
      const type = Array.isArray(item.dcType) ? item.dcType[0] : item.dcType;
      descParts.push(type);
    }

    // Get country for location
    const country = Array.isArray(item.country)
      ? item.country[0]
      : item.country || 'Europe';

    return {
      id: `europeana-${item.id}`,
      title: cleanText(title),
      artist: cleanText(artist),
      year,
      medium: item.dcFormat ? extractMedium(item.dcFormat) : undefined,
      dimensions: undefined,
      museum: dataProvider,
      location: country,
      description:
        descParts.length > 0 ? cleanText(descParts.join('. ')) : undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Europeana object:', error);
    return null;
  }
}

/**
 * Extract medium from format field (can be array)
 */
function extractMedium(format: any): string | undefined {
  const mediumStr = Array.isArray(format) ? format[0] : format;
  return mediumStr ? cleanText(mediumStr) : undefined;
}

/**
 * Clean text by removing HTML tags and extra whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Get popular search terms for Europeana
 */
export function getPopularEuropeanaSearches(): string[] {
  return [
    'Vermeer',
    'Monet',
    'Van Gogh',
    'Renaissance',
    'Impressionism',
    'Baroque',
    'Rembrandt',
    'Picasso',
  ];
}

import type {
  MuseumServiceAdapter,
  MuseumSearchParams,
  MuseumSearchResult,
} from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const europeanaAdapter: MuseumServiceAdapter = {
  museumId: 'EUROPEANA',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchEuropeana({
      query: params.query,
      rows: params.maxResults,
    });
  },
};

registerAdapter(europeanaAdapter);
