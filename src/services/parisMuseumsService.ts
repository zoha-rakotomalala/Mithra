import type { Painting } from '@/types/painting';
import Config from 'react-native-config';

const PARIS_API_BASE = 'https://apicollections.parismusees.paris.fr/graphql';
const API_KEY = Config.PARIS_API_KEY;

interface ParisSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

interface ParisSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Paris Museums collection (14 museums, 250,000+ artworks)
 */
export async function searchParisMuseums(
  params: ParisSearchParams
): Promise<ParisSearchResult> {
  try {
    const { query, limit = 30, offset = 0 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    // Paris Museums uses GraphQL API
    const graphqlQuery = `
      query SearchArtworks($query: String!, $limit: Int!, $offset: Int!) {
        nodeQuery(
          filter: {
            conditions: [
              { field: "title", value: [$query], operator: LIKE }
              { field: "type", value: ["oeuvre"] }
              { field: "field_visuel", operator: IS_NOT_NULL }
            ]
          }
          limit: $limit
          offset: $offset
        ) {
          count
          entities {
            ... on NodeOeuvre {
              nid
              title
              fieldAuteurs {
                entity {
                  ... on TaxonomyTermAuteurs {
                    name
                  }
                }
              }
              fieldDateProduction {
                value
              }
              fieldTechnique
              fieldDimensions
              fieldMusee {
                entity {
                  ... on TaxonomyTermMusee {
                    name
                  }
                }
              }
              fieldVisuel {
                entity {
                  ... on MediaImage {
                    fieldMediaImage {
                      url
                      derivative(style: LARGE) {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(PARIS_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          query: query.trim(),
          limit,
          offset,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Paris Museums API error: ${response.status}`);
    }

    const data = await response.json();
    const nodeQuery = data.data?.nodeQuery;

    if (!nodeQuery) {
      return { paintings: [], totalResults: 0 };
    }

    const entities = nodeQuery.entities || [];
    const count = nodeQuery.count || 0;

    const paintings = entities
      .map((obj: any) => parseParisObject(obj))
      .filter((p: Painting | null) => p !== null) as Painting[];

    return {
      paintings,
      totalResults: count,
    };
  } catch (error) {
    console.error('Error searching Paris Museums:', error);
    throw error;
  }
}

/**
 * Parse Paris Museums object into Painting format
 */
function parseParisObject(obj: any): Painting | null {
  try {
    const title = obj.title || 'Untitled';

    // Extract artist
    const artists = obj.fieldAuteurs || [];
    const artist = artists.length > 0 && artists[0].entity
      ? artists[0].entity.name
      : 'Unknown Artist';

    // Extract image URLs
    const visualEntity = obj.fieldVisuel?.entity;
    if (!visualEntity?.fieldMediaImage) return null;

    const imageData = visualEntity.fieldMediaImage;
    const imageUrl = imageData.url;
    const thumbnailUrl = imageData.derivative?.url || imageUrl;

    // Extract year
    let year: number | undefined;
    if (obj.fieldDateProduction?.value) {
      const match = obj.fieldDateProduction.value.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    // Extract museum name
    const museumEntity = obj.fieldMusee?.entity;
    const museumName = museumEntity?.name || 'Paris Museums';

    return {
      id: `paris-${obj.nid}`,
      title,
      artist,
      year,
      medium: obj.fieldTechnique || undefined,
      dimensions: obj.fieldDimensions || undefined,
      museum: museumName,
      location: 'Paris, France',
      description: undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
    };
  } catch (error) {
    console.error('Error parsing Paris Museums object:', error);
    return null;
  }
}

/**
 * Get popular artists in Paris Museums
 */
export function getPopularParisArtists(): string[] {
  return [
    'Auguste Rodin',
    'Camille Claudel',
    'Gustave Courbet',
    'Eugène Delacroix',
    'Jean-Auguste-Dominique Ingres',
    'François Boucher',
  ];
}

function generateColorFromString(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#95E1D3', '#F38181',
    '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#E8B86D',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}