import type { Painting } from '@/types/painting';

const JOCONDE_API_BASE = 'https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/base-joconde-extrait/records';

type JocondeSearchParameters = {
  limit?: number;
  offset?: number;
  query: string;
}

type JocondeSearchResult = {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Joconde database (French National Museums)
 * Over 600,000 artworks from 350+ French museums
 */
export async function searchJoconde(
  parameters: JocondeSearchParameters
): Promise<JocondeSearchResult> {
  try {
    const { limit = 30, offset = 0, query } = parameters;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParameters = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      where: `search(titre, "${query}") OR search(auteur, "${query}")`,
      // Filter for items with images and paintings
      refine: 'domaine:"Peinture"',
    });

    const url = `${JOCONDE_API_BASE}?${queryParameters.toString()}`;
    console.log('🇫🇷 Searching Joconde (French Museums):', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Joconde API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];
    const totalCount = data.total_count || 0;

    const paintings = results
      .map((record: any) => parseJocondeObject(record))
      .filter((p: null | Painting) => p !== null) as Painting[];

    return {
      paintings,
      totalResults: totalCount,
    };
  } catch (error) {
    console.error('Error searching Joconde:', error);
    throw error;
  }
}

/**
 * Parse Joconde object into Painting format
 */
function parseJocondeObject(record: any): null | Painting {
  try {
    const fields = record;

    const title = fields.titre || 'Sans titre';
    const artist = fields.auteur || 'Artiste inconnu';

    // Joconde doesn't always provide direct image URLs in the API
    // We'll need to construct them or skip records without images
    // For now, we'll check if image reference exists
    const imageReference = fields.ref || fields.numero_inventaire;
    if (!imageReference) return null;

    // Note: Joconde images might require additional API calls or URL construction
    // This is a limitation of the open data API
    const imageUrl = fields.contient_image
      ? `https://data.culture.gouv.fr/explore/dataset/base-joconde-extrait/files/${imageReference}/300/`
      : '';

    if (!imageUrl) return null;

    const thumbnailUrl = imageUrl;

    // Extract year
    let year: number | undefined;
    if (fields.periode_creation) {
      const match = fields.periode_creation.match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    } else if (fields.millesime_creation) {
      const match = fields.millesime_creation.toString().match(/\d{4}/);
      if (match) year = Number.parseInt(match[0]);
    }

    // Build description
    const descParts: string[] = [];
    if (fields.denomination) descParts.push(fields.denomination);
    if (fields.ecole_pays) descParts.push(fields.ecole_pays);
    if (fields.periode_creation) descParts.push(fields.periode_creation);

    // Extract museum and location
    const museum = fields.musee || 'Musée français';
    const location = fields.ville
      ? `${fields.ville}, France`
      : 'France';

    return {
      artist,
      color: generateColorFromString(title),
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      dimensions: fields.dimensions || undefined,
      id: `joconde-${imageReference}`,
      imageUrl,
      isSeen: false,
      location,
      medium: fields.materiaux_techniques || undefined,
      museum,
      thumbnailUrl,
      title,
      wantToVisit: false,
      year,
    };
  } catch (error) {
    console.error('Error parsing Joconde object:', error);
    return null;
  }
}

/**
 * Get popular French artists
 */
export function getPopularJocondeArtists(): string[] {
  return [
    'Claude Monet',
    'Edgar Degas',
    'Pierre-Auguste Renoir',
    'Paul Cézanne',
    'Gustave Courbet',
    'Eugène Delacroix',
    'Jean-Auguste-Dominique Ingres',
    'Nicolas Poussin',
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