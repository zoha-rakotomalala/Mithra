import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const NG_ES_API = 'https://data.ng.ac.uk/es/public/_search';

interface NGSearchParams {
  query: string;
  limit?: number;
}

interface NGSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search National Gallery (UK) collection via Elasticsearch API
 */
export async function searchNationalGallery(
  params: NGSearchParams
): Promise<NGSearchResult> {
  try {
    const { query, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    console.log('🇬🇧 Searching National Gallery:', query);

    // POST to Elasticsearch endpoint
    const data = await museumApi.post(NG_ES_API, {
      json: {
        query: {
          bool: {
            must: [
              { multi_match: { query: query.trim(), fields: ['summary.title', 'creation.maker.summary.title', 'summary.description'] } },
              { term: { '@datatype.base': 'object' } },
            ],
          },
        },
        size: limit,
        _source: ['summary', 'creation', 'identifier'],
      },
      headers: { 'Content-Type': 'application/json' },
    }).json<any>();

    const hits = data.hits?.hits || [];
    const total = data.hits?.total?.value || 0;

    const paintings = hits
      .map((hit: any) => parseNGElasticsearchHit(hit))
      .filter((p: Painting | null): p is Painting => p !== null);

    return { paintings, totalResults: total };
  } catch (error) {
    console.error('Error searching National Gallery:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse an Elasticsearch hit into a Painting
 */
function parseNGElasticsearchHit(hit: any): Painting | null {
  try {
    const src = hit._source;
    const title = src?.summary?.title || 'Untitled';
    if (title === 'Untitled') return null;

    const maker = src?.creation?.[0]?.maker?.[0];
    const artistRaw = maker?.summary?.title || src?.creation?.[0]?.attribution?.[0]?.value || 'Unknown Artist';
    const artist = cleanArtistName(artistRaw);

    // Extract year from creation date
    let year: number | undefined;
    const dateStr = src?.creation?.[0]?.date?.[0]?.value;
    if (dateStr) {
      const match = dateStr.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Extract image via IIIF using the object number (e.g., NG6607)
    const identifiers = src?.identifier || [];
    const objNumEntry = identifiers.find((i: any) => i.type === 'object number');
    const objectNumber = objNumEntry?.value;
    if (!objectNumber) return null;

    const imageUrl = `https://media.ng-london.org.uk/iiif/painting-${objectNumber}/full/!800,800/0/default.jpg`;
    const thumbnailUrl = `https://media.ng-london.org.uk/iiif/painting-${objectNumber}/full/!400,400/0/default.jpg`;

    const medium = src?.summary?.medium;
    const dimensions = src?.summary?.dimensions;

    return {
      id: `ng-${hit._id}`,
      title,
      artist,
      year,
      medium,
      dimensions,
      museum: 'National Gallery',
      location: 'London, United Kingdom',
      description: src?.summary?.description,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing NG hit:', error);
    return null;
  }
}
/**
 * Get popular National Gallery artists
 */
export function getPopularNGArtists(): string[] {
  return [
    'J.M.W. Turner',
    'John Constable',
    'Leonardo da Vinci',
    'Rembrandt',
    'Vincent van Gogh',
    'Claude Monet',
    'Titian',
  ];
}



import type { MuseumServiceAdapter, MuseumSearchParams, MuseumSearchResult } from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const nationalGalleryAdapter: MuseumServiceAdapter = {
  museumId: 'NG',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchNationalGallery({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(nationalGalleryAdapter);
