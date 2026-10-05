import type { Painting } from '@/types/painting';

import { museumApi } from './museumApiClient';
import { searchWikidataRecords } from './wikidataService';

/**
 * Musée du Louvre has no search API of its own. Wikidata files its paintings
 * under the Department of Paintings (Q3044768, ~10,500) and a handful directly
 * under the museum (Q19675), so the search runs through the Wikidata adapter
 * with that collection filter. Records carrying a Louvre ark id (P9394) are
 * then enriched from the museum's own collection JSON, which has the official
 * photograph and the catalogue page.
 */
const LOUVRE_COLLECTIONS = ['Q3044768', 'Q19675'];
const LOUVRE_ARK_PROPERTY = 'P9394';
const LOUVRE_COLLECTION_BASE = 'https://collections.louvre.fr/ark:/53355/cl';

type LouvreRecord = {
  image?: { urlImage?: string; urlThumbnail?: string }[];
  url?: string;
};

type LouvreSearchParameters = {
  limit?: number;
  query: string;
};

type LouvreSearchResult = {
  paintings: Painting[];
  totalResults: number;
};

/**
 * Official photograph and catalogue URL for a Louvre ark id such as
 * `010065872`. Returns an empty object when the fetch fails: Wikidata's data
 * stands on its own.
 */
async function louvreEnrichment(
  arkId: string,
): Promise<Pick<Painting, 'imageUrl' | 'objectURL' | 'thumbnailUrl'>> {
  try {
    const record = await museumApi
      .get(`${LOUVRE_COLLECTION_BASE}${arkId}.json`)
      .json<LouvreRecord>();
    const image = record.image?.[0];
    return {
      imageUrl: image?.urlImage,
      objectURL: record.url,
      thumbnailUrl: image?.urlThumbnail ?? image?.urlImage,
    };
  } catch {
    return {};
  }
}

/**
 * Search the Louvre's paintings. Wikidata supplies the records; the Louvre's
 * collection JSON supplies the official image where an ark id exists.
 */
export async function searchLouvre(
  parameters: LouvreSearchParameters,
): Promise<LouvreSearchResult> {
  try {
    const { limit = 20, query } = parameters;

    const { records, totalResults } = await searchWikidataRecords({
      collections: LOUVRE_COLLECTIONS,
      externalIdProperties: [LOUVRE_ARK_PROPERTY],
      idPrefix: 'louvre',
      limit,
      location: 'Paris, France',
      museum: 'Musée du Louvre',
      query,
    });

    const paintings = await Promise.all(
      records.map(async ({ externalIds, painting }) => {
        const arkId = externalIds[LOUVRE_ARK_PROPERTY];
        if (!arkId) return painting;
        const official = await louvreEnrichment(arkId);
        return {
          ...painting,
          // Same id scheme as before the fold, so paintings already kept in
          // a collection still match a fresh search result.
          id: `louvre-${arkId}`,
          imageUrl: official.imageUrl ?? painting.imageUrl,
          objectURL: official.objectURL ?? painting.objectURL,
          thumbnailUrl: official.thumbnailUrl ?? painting.thumbnailUrl,
        };
      }),
    );

    // A painting with no image at all is not a result the Search screen can
    // show; the previous adapter dropped these too.
    const withImage = paintings.filter((p) => Boolean(p.imageUrl));

    return { paintings: withImage, totalResults };
  } catch (error) {
    console.error('Error searching Louvre:', error);
    return { paintings: [], totalResults: 0 };
  }
}

import type {
  MuseumSearchParams as MuseumSearchParameters,
  MuseumSearchResult,
  MuseumServiceAdapter,
} from './types/museumAdapter';

import { registerAdapter } from './museumAdapterRegistry';

export const louvreAdapter: MuseumServiceAdapter = {
  museumId: 'LOUVRE',
  async search(
    parameters: MuseumSearchParameters,
  ): Promise<MuseumSearchResult> {
    return searchLouvre({
      limit: parameters.maxResults,
      query: parameters.query,
    });
  },
};

registerAdapter(louvreAdapter);
