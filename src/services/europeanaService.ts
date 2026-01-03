import type { Painting } from '@/types/painting';

import Config from 'react-native-config';

const EUROPEANA_API_BASE = 'https://api.europeana.eu/record/v2';
const API_KEY = Config.EUROPEANA_API_KEY;

type EuropeanaSearchParameters = {
  page?: number;
  query: string;
  rows?: number;
}

type EuropeanaSearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Europeana collection (50M+ objects from European cultural institutions)
 */
export async function searchEuropeana(
  parameters: EuropeanaSearchParameters
): Promise<EuropeanaSearchResult> {
  try {
    const { page = 1, query, rows = 30 } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParameters = new URLSearchParams({
      media: 'true', // Must have media
      profile: 'rich', // Get full metadata
      qf: 'TYPE:IMAGE', // Filter for images
      query: query.trim(),
      reusability: 'open', // Only openly licensed content
      rows: rows.toString(),
      start: ((page - 1) * rows + 1).toString(),
      theme: 'art', // Focus on art theme
      wskey: API_KEY,
    });

    const url = `${EUROPEANA_API_BASE}/search.json?${queryParameters.toString()}`;
    console.log('🇪🇺 Searching Europeana:', url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Europeana API key');
      }
      throw new Error(`Europeana API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Europeana search failed');
    }

    const items = data.items || [];
    const totalResults = data.totalResults || 0;

    const paintings = items
      .map((item: any) => parseEuropeanaObject(item))
      .filter((p: null | Painting) => p !== null) as Painting[];

    return {
      paintings,
      totalResults,
    };
  } catch (error) {
    console.error('Error searching Europeana:', error);
    throw error;
  }
}

/**
 * Parse Europeana object into Painting format
 */
function parseEuropeanaObject(item: any): null | Painting {
  try {
    // Extract title (can be array or string)
    const titleRaw = item.title || item.dcTitle;
    const title = Array.isArray(titleRaw) ? titleRaw[0] : titleRaw || 'Untitled';

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
      const yearString = Array.isArray(yearRaw) ? yearRaw[0] : yearRaw;
      const match = yearString.toString().match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
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
      artist: cleanText(artist),
      color: generateColorFromString(title),
      description: descParts.length > 0 ? cleanText(descParts.join('. ')) : undefined,
      dimensions: undefined,
      id: `europeana-${item.id}`,
      imageUrl,
      isSeen: false,
      location: country,
      medium: item.dcFormat ? extractMedium(item.dcFormat) : undefined,
      museum: dataProvider,
      thumbnailUrl,
      title: cleanText(title),
      wantToVisit: false,
      year,
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
  const mediumString = Array.isArray(format) ? format[0] : format;
  return mediumString ? cleanText(mediumString) : undefined;
}

/**
 * Clean text by removing HTML tags and extra whitespace
 */
function cleanText(text: string): string {
  return text
    .replaceAll(/<[^>]*>/g, '') // Remove HTML tags
    .replaceAll(/\s+/g, ' ') // Normalize whitespace
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