import type { Painting } from '@/types/painting';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

// Helper to generate unique IDs
let idCounter = 1000; // Start high to avoid collision with mock data
const generateId = () => idCounter++;

export interface WikidataSearchParams {
  query: string;
  limit?: number;
}

export interface WikidataSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search for paintings in Wikidata
 * @param params Search parameters
 * @returns Array of paintings with complete metadata
 */
export async function searchPaintings(
  params: WikidataSearchParams
): Promise<WikidataSearchResult> {
  const { query, limit = 20 } = params;

  if (!query || query.trim().length === 0) {
    return { paintings: [], totalResults: 0 };
  }

  const sparqlQuery = buildSearchQuery(query, limit);

  try {
    const response = await fetch(WIKIDATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`);
    }

    const data = await response.json();
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
    const response = await fetch(WIKIDATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`);
    }

    const data = await response.json();
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
  if (!data.results || !data.results.bindings) {
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
      id: generateId(),
      title: item.paintingLabel?.value || 'Untitled',
      artist: item.artistLabel?.value || 'Unknown Artist',
      year: item.year?.value ? parseInt(item.year.value) : undefined,
      medium: item.mediumLabel?.value,
      dimensions,
      museum,
      location,
      description: item.description?.value,
      imageUrl: item.image?.value,
      color,
      isSeen: false,
      isInPalette: false,
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
    if (!seen.has(key)) {
      seen.set(key, painting);
    } else {
      const existing = seen.get(key)!;
      // Replace if new one has image and existing doesn't
      if (painting.imageUrl && !existing.imageUrl) {
        seen.set(key, painting);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Infer location from museum name
 */
function inferLocationFromMuseum(museum: string): string | undefined {
  const museumLocations: Record<string, string> = {
    'Museum of Modern Art': 'New York City, USA',
    'MoMA': 'New York City, USA',
    'Metropolitan Museum of Art': 'New York City, USA',
    'Louvre': 'Paris, France',
    'Musée du Louvre': 'Paris, France',
    'Rijksmuseum': 'Amsterdam, Netherlands',
    'Van Gogh Museum': 'Amsterdam, Netherlands',
    'Uffizi Gallery': 'Florence, Italy',
    'Galleria degli Uffizi': 'Florence, Italy',
    'Prado Museum': 'Madrid, Spain',
    'Museo del Prado': 'Madrid, Spain',
    'National Gallery': 'London, UK',
    'Tate Modern': 'London, UK',
    'Hermitage Museum': 'Saint Petersburg, Russia',
    'Musée d\'Orsay': 'Paris, France',
    'Art Institute of Chicago': 'Chicago, USA',
    'National Gallery of Art': 'Washington D.C., USA',
    'Mauritshuis': 'The Hague, Netherlands',
    'Kunsthistorisches Museum': 'Vienna, Austria',
    'Alte Pinakothek': 'Munich, Germany',
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
 * Generate a consistent color from a string (for placeholders)
 */
function generateColorFromString(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#95E1D3', '#F38181',
    '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#E8B86D',
    '#F4976C', '#4A5F7A', '#2C3639', '#D4AF37', '#7FB3D5',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
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