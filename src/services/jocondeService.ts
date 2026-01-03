import type { Painting } from '@/types/painting';

const JOCONDE_API_BASE = 'https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/base-joconde-extrait/records';

interface JocondeSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

interface JocondeSearchResult {
  paintings: Painting[];
  totalResults: number;
}

/**
 * Search Joconde database (French National Museums)
 * Over 600,000 artworks from 350+ French museums
 */
export async function searchJoconde(
  params: JocondeSearchParams
): Promise<JocondeSearchResult> {
  try {
    const { query, limit = 30, offset = 0 } = params;

    if (!query || query.trim().length === 0) {
      return { paintings: [], totalResults: 0 };
    }

    const queryParams = new URLSearchParams({
      where: `search(titre, "${query}") OR search(auteur, "${query}")`,
      limit: limit.toString(),
      offset: offset.toString(),
      // Filter for items with images and paintings
      refine: 'domaine:"Peinture"',
    });

    const url = `${JOCONDE_API_BASE}?${queryParams.toString()}`;
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
      .filter((p: Painting | null) => p !== null) as Painting[];

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
function parseJocondeObject(record: any): Painting | null {
  try {
    const fields = record;

    const title = fields.titre || 'Sans titre';
    const artist = fields.auteur || 'Artiste inconnu';

    // Joconde doesn't always provide direct image URLs in the API
    // We'll need to construct them or skip records without images
    // For now, we'll check if image reference exists
    const imageRef = fields.ref || fields.numero_inventaire;
    if (!imageRef) return null;

    // Note: Joconde images might require additional API calls or URL construction
    // This is a limitation of the open data API
    const imageUrl = fields.contient_image
      ? `https://data.culture.gouv.fr/explore/dataset/base-joconde-extrait/files/${imageRef}/300/`
      : '';

    if (!imageUrl) return null;

    const thumbnailUrl = imageUrl;

    // Extract year
    let year: number | undefined;
    if (fields.periode_creation) {
      const match = fields.periode_creation.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    } else if (fields.millesime_creation) {
      const match = fields.millesime_creation.toString().match(/\d{4}/);
      if (match) year = parseInt(match[0]);
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
      id: `joconde-${imageRef}`,
      title,
      artist,
      year,
      medium: fields.materiaux_techniques || undefined,
      dimensions: fields.dimensions || undefined,
      museum,
      location,
      description: descParts.length > 0 ? descParts.join('. ') : undefined,
      imageUrl,
      thumbnailUrl,
      color: generateColorFromString(title),
      isSeen: false,
      wantToVisit: false,
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