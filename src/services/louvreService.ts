import type { Painting } from '@/types/painting';
import { cleanArtistName } from './utils/searchHelpers';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const LOUVRE_DATA_BASE = 'https://collections.louvre.fr/ark:/53355';

const SPARQL_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'PaletteApp/1.0 (art collection mobile app)',
};

interface LouvreSearchParams {
  query: string;
  limit?: number;
}

interface LouvreSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Convert a Wikimedia Commons image URL to a thumbnail URL
 */
function getWikimediaThumbnail(
  imageUrl: string,
  width = 400,
): string | undefined {
  if (!imageUrl?.includes('upload.wikimedia.org')) return undefined;
  const match = imageUrl.match(/\/commons\/(.+\/([^/]+))$/);
  if (!match) return undefined;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${match[1]}/${width}px-${match[2]}`;
}

/**
 * Search Musée du Louvre via Wikidata SPARQL (paintings located at the Louvre)
 */
export async function searchLouvre(
  params: LouvreSearchParams,
): Promise<LouvreSearchResult> {
  try {
    const { query, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const searchTerm = query.trim().replace(/"/g, '\\"');

    // Use mwapi:Generator for full-text search — "Search" mode is invalid on www.wikidata.org
    const sparqlQuery = `
      SELECT ?painting ?paintingLabel ?artistLabel ?image ?louvreId ?year ?mediumLabel WHERE {
        {
          SELECT ?painting WHERE {
            SERVICE wikibase:mwapi {
              bd:serviceParam wikibase:endpoint "www.wikidata.org";
                              wikibase:api "Generator";
                              mwapi:generator "search";
                              mwapi:gsrsearch "${searchTerm} haswbstatement:P31=Q3305213 haswbstatement:P276=Q19675";
                              mwapi:gsrlimit "${limit}".
              ?title wikibase:apiOutput mwapi:title.
            }
            BIND(IRI(CONCAT("http://www.wikidata.org/entity/", ?title)) AS ?painting)
          } LIMIT ${limit}
        }
        hint:Prior hint:runFirst "true".
        ?painting wdt:P31 wd:Q3305213;
                  wdt:P276 wd:Q19675.
        OPTIONAL { ?painting wdt:P170 ?artist. }
        OPTIONAL { ?painting wdt:P18 ?image. }
        OPTIONAL { ?painting wdt:P9394 ?louvreId. }
        OPTIONAL { ?painting wdt:P571 ?yearDate. BIND(YEAR(?yearDate) as ?year) }
        OPTIONAL { ?painting wdt:P186 ?medium. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      } LIMIT ${limit}
    `;

    console.log('🇫🇷 Searching Louvre via Wikidata');

    const data = await museumApi
      .post(WIKIDATA_ENDPOINT, {
        body: `query=${encodeURIComponent(sparqlQuery)}`,
        headers: SPARQL_HEADERS,
        timeout: 20000,
      })
      .json<any>();

    const bindings = data.results?.bindings || [];

    // Try to enrich with Louvre JSON for items that have a louvreId
    const paintings = await Promise.all(
      bindings.map((item: any) => parseLouvreResult(item)),
    );

    const filtered = paintings.filter((p): p is Painting => p !== null);

    return { paintings: filtered, totalResults: filtered.length };
  } catch (error) {
    console.error('Error searching Louvre:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse a Wikidata result into a Painting, optionally enriching from Louvre JSON
 */
async function parseLouvreResult(item: any): Promise<Painting | null> {
  try {
    const title = item.paintingLabel?.value || 'Untitled';
    const artistRaw = item.artistLabel?.value || 'Unknown Artist';
    const artist = cleanArtistName(artistRaw);

    let imageUrl = item.image?.value;
    let thumbnailUrl = imageUrl ? getWikimediaThumbnail(imageUrl) : undefined;

    const louvreId = item.louvreId?.value;

    // Try to fetch richer data from Louvre JSON
    if (louvreId) {
      try {
        const louvreData = await museumApi
          .get(`${LOUVRE_DATA_BASE}/${louvreId}.json`)
          .json<any>();
        if (louvreData.image) {
          imageUrl = louvreData.image;
          thumbnailUrl = thumbnailUrl || louvreData.image;
        }
      } catch {
        // Louvre JSON fetch failed, continue with Wikidata data
      }
    }

    if (!imageUrl) return null;

    const qMatch = item.painting?.value?.match(/Q\d+$/);
    const id = louvreId || (qMatch ? qMatch[0] : 'unknown');

    return {
      id: `louvre-${id}`,
      title,
      artist,
      year: item.year?.value ? parseInt(item.year.value) : undefined,
      medium: item.mediumLabel?.value,
      dimensions: undefined,
      museum: 'Musée du Louvre',
      location: 'Paris, France',
      description: undefined,
      imageUrl,
      thumbnailUrl: thumbnailUrl || imageUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Louvre result:', error);
    return null;
  }
}

import type {
  MuseumServiceAdapter,
  MuseumSearchParams,
  MuseumSearchResult,
} from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const louvreAdapter: MuseumServiceAdapter = {
  museumId: 'LOUVRE',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchLouvre({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(louvreAdapter);
