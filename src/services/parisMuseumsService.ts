import type { Painting } from '@/types/painting';
import { generateColorFromString } from '@/utils/colorGenerator';
import { museumApi } from './museumApiClient';

import Config from 'react-native-config';

const PARIS_API_BASE = 'https://apicollections.parismusees.paris.fr/graphql';
const API_KEY = Config.PARIS_API_KEY;

type ParisSearchParameters = {
  limit?: number;
  offset?: number;
  query: string;
}

type ParisSearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Paris Museums collection (14 museums, 250,000+ artworks)
 */
export async function searchParisMuseums(
  parameters: ParisSearchParameters
): Promise<ParisSearchResult> {
  try {
    const { limit = 30, offset = 0, query } = parameters;

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

    const data = await museumApi.post(PARIS_API_BASE, {
      json: {
        query: graphqlQuery,
        variables: {
          limit,
          offset,
          query: `%${query.trim()}%`,
        },
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    }).json<any>();
    const nodeQuery = data.data?.nodeQuery;

    if (!nodeQuery) {
      return { paintings: [], totalResults: 0 };
    }

    const entities = nodeQuery.entities || [];
    const count = nodeQuery.count || 0;

    const paintings = entities
      .map((object: any) => parseParisObject(object))
      .filter((p: null | Painting) => p !== null) as Painting[];

    return {
      paintings,
      totalResults: count,
    };
  } catch (error) {
    console.error('Error searching Paris Museums:', error);
    return { paintings: [], totalResults: 0 };
  }
}

/**
 * Parse Paris Museums object into Painting format
 */
function parseParisObject(object: any): null | Painting {
  try {
    const title = object.title || 'Untitled';

    // Extract artist
    const artists = object.fieldAuteurs || [];
    const artist = artists.length > 0 && artists[0].entity
      ? artists[0].entity.name
      : 'Unknown Artist';

    // Extract image URLs
    const visualEntity = object.fieldVisuel?.entity;
    if (!visualEntity?.fieldMediaImage) return null;

    const imageData = visualEntity.fieldMediaImage;
    const imageUrl = imageData.url;
    const thumbnailUrl = imageData.derivative?.url || imageUrl;

    // Extract year
    let year: number | undefined;
    if (object.fieldDateProduction?.value) {
      const match = object.fieldDateProduction.value.match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    }

    // Extract museum name
    const museumEntity = object.fieldMusee?.entity;
    const museumName = museumEntity?.name || 'Paris Museums';

    return {
      artist,
      color: generateColorFromString(title),
      description: undefined,
      dimensions: object.fieldDimensions || undefined,
      id: `paris-${object.nid}`,
      imageUrl,
      isSeen: false,
      location: 'Paris, France',
      medium: object.fieldTechnique || undefined,
      museum: museumName,
      thumbnailUrl,
      title,
      wantToVisit: false,
      year,
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



import type { MuseumServiceAdapter, MuseumSearchParams, MuseumSearchResult } from './types/museumAdapter';
import { registerAdapter } from './museumAdapterRegistry';

export const parisMuseumsAdapter: MuseumServiceAdapter = {
  museumId: 'PARIS',
  async search(params: MuseumSearchParams): Promise<MuseumSearchResult> {
    return searchParisMuseums({
      query: params.query,
      limit: params.maxResults,
    });
  },
};

registerAdapter(parisMuseumsAdapter);
