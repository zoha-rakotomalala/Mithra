import type { Painting } from '@/types/painting';

import { searchWikidataRecords } from './wikidataService';

/**
 * Musée d'Orsay has no public search API, and its website refuses scripted
 * requests, so there is nothing to enrich from. Wikidata holds 4,916 of its
 * paintings under collection Q23402 (1,832 with an image), 4,875 of them with
 * a Musée d'Orsay artwork id (P4659), which gives the page on the museum's
 * site. Records without an image are passed through: the Search screen's
 * quality filter decides what it can show.
 */
const ORSAY_COLLECTIONS = ['Q23402'];
const ORSAY_ARTWORK_ID_PROPERTY = 'P4659';
const ORSAY_ARTWORK_PAGE = 'https://www.musee-orsay.fr/fr/oeuvres/';

type OrsaySearchParameters = {
  limit?: number;
  query: string;
};

type OrsaySearchResult = {
  paintings: Painting[];
  totalResults: number;
};

export async function searchOrsay(
  parameters: OrsaySearchParameters,
): Promise<OrsaySearchResult> {
  try {
    const { limit = 20, query } = parameters;

    const { records, totalResults } = await searchWikidataRecords({
      collections: ORSAY_COLLECTIONS,
      externalIdProperties: [ORSAY_ARTWORK_ID_PROPERTY],
      idPrefix: 'orsay',
      limit,
      location: 'Paris, France',
      museum: "Musée d'Orsay",
      query,
    });

    const paintings = records.map(({ externalIds, painting }) => {
      const artworkId = externalIds[ORSAY_ARTWORK_ID_PROPERTY];
      return artworkId
        ? { ...painting, objectURL: `${ORSAY_ARTWORK_PAGE}${artworkId}` }
        : painting;
    });

    return { paintings, totalResults };
  } catch (error) {
    console.error("Error searching Musée d'Orsay:", error);
    return { paintings: [], totalResults: 0 };
  }
}

import type {
  MuseumSearchParams as MuseumSearchParameters,
  MuseumSearchResult,
  MuseumServiceAdapter,
} from './types/museumAdapter';

import { registerAdapter } from './museumAdapterRegistry';

export const orsayAdapter: MuseumServiceAdapter = {
  museumId: 'ORSAY',
  async search(
    parameters: MuseumSearchParameters,
  ): Promise<MuseumSearchResult> {
    return searchOrsay({
      limit: parameters.maxResults,
      query: parameters.query,
    });
  },
};

registerAdapter(orsayAdapter);
