import type { Painting } from '@/types/painting';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

// Helper to generate unique IDs
let idCounter = 1000; // Start high to avoid collision with mock data
const generateId = () => idCounter++;

export type WikidataSearchParams = {
  limit?: number;
  query: string;
}

export type WikidataSearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search for paintings in Wikidata
 * @param params Search parameters
 * @returns Array of paintings with complete metadata
 */
export async function searchPaintings(
  parameters: WikidataSearchParams
): Promise<WikidataSearchResult> {
  const { limit = 20, query } = parameters;

  if (!query || query.trim().length === 0) {
    return { paintings: [], totalResults: 0 };
  }

  const sparqlQuery = buildSearchQuery(query, limit);

  try {
    const data = await museumApi.post(WIKIDATA_ENDPOINT, {
      body: `query=${encodeURIComponent(sparqlQuery)}`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).json<any>();
    const paintings = parsePaintings(data);

    return {
      paintings,
      totalResults: paintings.length,
    };
  } catch (error) {
    console.error('Error searching Wikidata:', error);
    throw new Error('Failed to search paintings. Please check your connection.');
  }
}

/**
 * Search paintings by artist name
 */
export async function searchByArtist(
  artistName: string,
  limit = 50
): Promise<WikidataSearchResult> {
  const sparqlQuery = `
    SELECT DISTINCT ?painting ?paintingLabel ?artistLabel ?image ?year
           ?museumLabel ?locationLabel ?height ?width ?mediumLabel ?description
    WHERE {
      ?artist wdt:P31 wd:Q5;                    # Artist is human
              rdfs:label ?artistLabel.
      FILTER(CONTAINS(LCASE(?artistLabel), "${artistName.toLowerCase()}"))
      FILTER(LANG(?artistLabel) = "en")

      ?painting wdt:P31 wd:Q3305213;            # Instance of painting
                wdt:P170 ?artist.                # Creator

      OPTIONAL { ?painting wdt:P18 ?image. }    # Image
      OPTIONAL { ?painting wdt:P571 ?yearDate.
                 BIND(YEAR(?yearDate) as ?year) }
      OPTIONAL { ?painting wdt:P195 ?museum. }  # Collection
      OPTIONAL { ?painting wdt:P276 ?location. } # Location
      OPTIONAL { ?painting wdt:P2048 ?height. } # Height
      OPTIONAL { ?painting wdt:P2049 ?width. }  # Width
      OPTIONAL { ?painting wdt:P186 ?medium. }  # Material/Medium
      OPTIONAL {
        ?painting schema:description ?description.
        FILTER(LANG(?description) = "en")
      }

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
      }
    }
    LIMIT ${limit}
  `;

  try {
    const data = await museumApi.post(WIKIDATA_ENDPOINT, {
      body: `query=${encodeURIComponent(sparqlQuery)}`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).json<any>();
    const paintings = parsePaintings(data);

    return {
      paintings,
      totalResults: paintings.length,
    };
  } catch (error) {
    console.error('Error searching by artist:', error);
    throw new Error('Failed to search paintings by artist.');
  }
}

/**
 * Build SPARQL query for general search
 */
function buildSearchQuery(query: string, limit: number): string {
  const searchTerm = query.toLowerCase().trim();

  return `
    SELECT DISTINCT ?painting ?paintingLabel ?artistLabel ?image ?year
           ?museumLabel ?locationLabel ?height ?width ?mediumLabel ?description
    WHERE {
      ?painting wdt:P31 wd:Q3305213;            # Instance of painting
                wdt:P170 ?artist.                # Has creator

      OPTIONAL { ?painting wdt:P18 ?image. }    # Image
      OPTIONAL { ?painting wdt:P571 ?yearDate.
                 BIND(YEAR(?yearDate) as ?year) }
      OPTIONAL { ?painting wdt:P195 ?museum. }  # Collection
      OPTIONAL { ?painting wdt:P276 ?location. } # Location
      OPTIONAL { ?painting wdt:P2048 ?height. } # Height in cm
      OPTIONAL { ?painting wdt:P2049 ?width. }  # Width in cm
      OPTIONAL { ?painting wdt:P186 ?medium. }  # Material/Medium
      OPTIONAL {
        ?painting schema:description ?description.
        FILTER(LANG(?description) = "en")
      }

      # Filter by search term (painting name or artist name)
      FILTER(
        CONTAINS(LCASE(?paintingLabel), "${searchTerm}") ||
        CONTAINS(LCASE(?artistLabel), "${searchTerm}")
      )

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
      }
    }
    LIMIT ${limit}
  `;
}

/**
 * Parse Wikidata SPARQL results into Painting objects
 */
function parsePaintings(data: any): Painting[] {
  if (!data.results?.bindings) {
    return [];
  }

  const paintings: Painting[] = data.results.bindings.map((item: any) => {
    // Extract dimensions
    const height = item.height?.value;
    const width = item.width?.value;
    let dimensions: string | undefined;
    if (height && width) {
      dimensions = `${height} cm × ${width} cm`;
    } else if (height) {
      dimensions = `${height} cm (height)`;
    } else if (width) {
      dimensions = `${width} cm (width)`;
    }

    // Extract location (museum location)
    const museum = item.museumLabel?.value;
    const locationPlace = item.locationLabel?.value;
    let location = locationPlace;

    // If we have museum but no location, try to infer
    if (museum && !location) {
      location = inferLocationFromMuseum(museum);
    }

    // Generate color from title (for placeholder consistency)
    const color = generateColorFromString(item.paintingLabel?.value || '');

    return {
      artist: item.artistLabel?.value || 'Unknown Artist',
      color,
      description: item.description?.value,
      dimensions,
      id: generateId(),
      imageUrl: item.image?.value,
      isInPalette: false,
      isSeen: false,
      location,
      medium: item.mediumLabel?.value,
      museum,
      title: item.paintingLabel?.value || 'Untitled',
      year: item.year?.value ? Number.parseInt(item.year.value) : undefined,
    };
  });

  // Remove duplicates (same painting might appear multiple times)
  return deduplicatePaintings(paintings);
}

/**
 * Deduplicate paintings by title and artist
 */
function deduplicatePaintings(paintings: Painting[]): Painting[] {
  const seen = new Map<string, Painting>();

  for (const painting of paintings) {
    const key = `${painting.title}-${painting.artist}`.toLowerCase();

    // Keep the one with more complete data (has image, dimensions, etc.)
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      // Replace if new one has image and existing doesn't
      if (painting.imageUrl && !existing.imageUrl) {
        seen.set(key, painting);
      }
    } else {
      seen.set(key, painting);
    }
  }

  return [...seen.values()];
}

/**
 * Infer location from museum name
 */
function inferLocationFromMuseum(museum: string): string | undefined {
  const museumLocations: Record<string, string> = {
    'Alte Pinakothek': 'Munich, Germany',
    'Art Institute of Chicago': 'Chicago, USA',
    'Galleria degli Uffizi': 'Florence, Italy',
    'Hermitage Museum': 'Saint Petersburg, Russia',
    'Kunsthistorisches Museum': 'Vienna, Austria',
    'Louvre': 'Paris, France',
    'Mauritshuis': 'The Hague, Netherlands',
    'Metropolitan Museum of Art': 'New York City, USA',
    'MoMA': 'New York City, USA',
    'Musée d\'Orsay': 'Paris, France',
    'Musée du Louvre': 'Paris, France',
    'Museo del Prado': 'Madrid, Spain',
    'Museum of Modern Art': 'New York City, USA',
    'National Gallery': 'London, UK',
    'National Gallery of Art': 'Washington D.C., USA',
    'Prado Museum': 'Madrid, Spain',
    'Rijksmuseum': 'Amsterdam, Netherlands',
    'Tate Modern': 'London, UK',
    'Uffizi Gallery': 'Florence, Italy',
    'Van Gogh Museum': 'Amsterdam, Netherlands',
  };

  // Try exact match first
  if (museumLocations[museum]) {
    return museumLocations[museum];
  }

  // Try partial match
  for (const [name, location] of Object.entries(museumLocations)) {
    if (museum.includes(name) || name.includes(museum)) {
      return location;
    }
  }

  return undefined;
}



/**
 * Get suggestions for popular artists (for autocomplete)
 */
export function getPopularArtists(): string[] {
  return [
    'Vincent van Gogh',
    'Pablo Picasso',
    'Claude Monet',
    'Leonardo da Vinci',
    'Rembrandt',
    'Johannes Vermeer',
    'Michelangelo',
    'Salvador Dalí',
    'Frida Kahlo',
    'Gustav Klimt',
    'Edvard Munch',
    'Sandro Botticelli',
    'Caravaggio',
    'Paul Cézanne',
    'Henri Matisse',
    'Wassily Kandinsky',
    'Jackson Pollock',
    'Andy Warhol',
    'Raphael',
    'Diego Velázquez',
  ];
}

/**
 * Get suggestions for popular museums
 */
export function getPopularMuseums(): string[] {
  return [
    'Louvre',
    'Museum of Modern Art',
    'Metropolitan Museum of Art',
    'Rijksmuseum',
    'Van Gogh Museum',
    'Uffizi Gallery',
    'Prado Museum',
    'National Gallery',
    'Tate Modern',
    'Hermitage Museum',
  ];
}

import type { MuseumServiceAdapter, MuseumSearchParams, MuseumSearchResult } from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const wikidataAdapter: MuseumServiceAdapter = {
  museumId: 'WIKIDATA',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchPaintings({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(wikidataAdapter);
