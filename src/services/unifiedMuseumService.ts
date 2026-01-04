import type { Painting } from '@/types/painting';
import { searchMetMuseum } from './metMuseumService';
import { searchRijksmuseum } from './rijksmuseumService';
import { searchCleveland } from './clevelandService';
import { searchChicago } from './chicagoService';
import { searchHarvard } from './harvardService';
import { searchVA } from './vaService';
import { searchEuropeana } from './europeanaService';
import { searchParisMuseums } from './parisMuseumsService';
import { getMuseumsByIds, type MuseumConfig } from './museumRegistry';
import {
  cleanArtistName,
  sortByRelevance,
  removeDuplicates,
  filterByQuality,
  getDisplayMuseumName,
  type QualityFilter,
} from './utils/searchHelpers';

export interface UnifiedSearchParams {
  query: string;
  museumIds: string[];
  maxResultsPerMuseum?: number;
  qualityFilters?: QualityFilter;
}

export interface UnifiedSearchResult {
  paintings: Painting[];
  totalResults: number;
  resultsByMuseum: Record<string, number>;
}

/**
 * Search across multiple museums with smart filtering and relevance sorting
 */
export async function searchAllMuseums(
  params: UnifiedSearchParams
): Promise<UnifiedSearchResult> {
  const {
    query,
    museumIds,
    maxResultsPerMuseum = 20,
    qualityFilters = {
      requireImage: true,
      requireArtist: true,
      paintingsOnly: true,
      minRelevanceScore: 15,
    }
  } = params;

  if (!query || query.trim().length === 0) {
    return {
      paintings: [],
      totalResults: 0,
      resultsByMuseum: {}
    };
  }

  console.log(`🔍 Searching ${museumIds.length} museums for: "${query}"`);

  // Create search promises for each selected museum
  const searchPromises = museumIds.map(museumId =>
    searchSingleMuseum(museumId, query, maxResultsPerMuseum)
  );

  // Execute all searches in parallel
  const results = await Promise.allSettled(searchPromises);

  // Combine and process results
  let allPaintings: Painting[] = [];
  const resultsByMuseum: Record<string, number> = {};

  results.forEach((result, index) => {
    const museumId = museumIds[index];

    if (result.status === 'fulfilled') {
      const museumResults = result.value;
      allPaintings = allPaintings.concat(museumResults.paintings);
      resultsByMuseum[museumId] = museumResults.paintings.length;
      console.log(`✅ ${museumId}: ${museumResults.paintings.length} results`);
    } else {
      console.error(`❌ ${museumId}: ${result.reason}`);
      resultsByMuseum[museumId] = 0;
    }
  });

  console.log(`📊 Total before filtering: ${allPaintings.length} paintings`);

  // Clean artist names for ALL paintings
  allPaintings = allPaintings.map(painting => ({
    ...painting,
    artist: cleanArtistName(painting.artist),
  }));

  // Apply quality filtering
  allPaintings = filterByQuality(allPaintings, query, qualityFilters);
  console.log(`📊 After quality filter: ${allPaintings.length} paintings`);

  // Remove duplicates
  allPaintings = removeDuplicates(allPaintings);
  console.log(`📊 After deduplication: ${allPaintings.length} paintings`);

  // Sort by relevance
  allPaintings = sortByRelevance(allPaintings, query);
  console.log(`📊 Final results: ${allPaintings.length} paintings`);

  return {
    paintings: allPaintings,
    totalResults: allPaintings.length,
    resultsByMuseum,
  };
}

/**
 * Search a single museum by ID
 */
async function searchSingleMuseum(
  museumId: string,
  query: string,
  maxResults: number
): Promise<{ paintings: Painting[] }> {
  try {
    switch (museumId) {
      case 'MET':
        const metResult = await searchMetMuseum({ query, hasImages: true });
        return {
          paintings: metResult.paintings.slice(0, maxResults)
        };

      case 'RIJKS':
        const rijksResult = await searchRijksmuseum({
          query,
          limit: maxResults
        });
        return { paintings: rijksResult.paintings };

      case 'CLEVELAND':
        const clevelandResult = await searchCleveland({
          query,
          limit: maxResults
        });
        return { paintings: clevelandResult.paintings };

      case 'CHICAGO':
        const chicagoResult = await searchChicago({
          query,
          limit: maxResults
        });
        return { paintings: chicagoResult.paintings };

      case 'HARVARD':
        const harvardResult = await searchHarvard({
          query,
          size: maxResults
        });
        return { paintings: harvardResult.paintings };

      case 'VA':
        const vaResult = await searchVA({
          query,
          pageSize: maxResults
        });
        return { paintings: vaResult.paintings };

      case 'EUROPEANA':
        const europeanaResult = await searchEuropeana({
          query,
          rows: maxResults
        });
        return { paintings: europeanaResult.paintings };

      case 'PARIS':
        const parisResult = await searchParisMuseums({
          query,
          limit: maxResults
        });
        return { paintings: parisResult.paintings };

      default:
        console.warn(`Unknown or disabled museum ID: ${museumId}`);
        return { paintings: [] };
    }
  } catch (error) {
    console.error(`Error searching ${museumId}:`, error);
    // Return empty instead of throwing - allows other museums to work
    return { paintings: [] };
  }
}

/**
 * Get popular artists across selected museums
 */
export function getPopularArtistsByMuseums(museumIds: string[]): string[] {
  const allArtists: string[] = [];

  const artistsByMuseum: Record<string, string[]> = {
    MET: ['Vincent van Gogh', 'Claude Monet', 'Rembrandt'],
    RIJKS: ['Rembrandt', 'Johannes Vermeer', 'Frans Hals'],
    CLEVELAND: ['Pablo Picasso', 'Claude Monet', 'El Greco'],
    CHICAGO: ['Georges Seurat', 'Vincent van Gogh', 'Henri de Toulouse-Lautrec'],
    HARVARD: ['Rembrandt', 'Pablo Picasso', 'Albrecht Dürer'],
    VA: ['John Constable', 'J.M.W. Turner', 'Raphael'],
    EUROPEANA: ['Vermeer', 'Monet', 'Van Gogh'],
    PARIS: ['Auguste Rodin', 'Eugène Delacroix', 'Gustave Courbet'],
  };

  museumIds.forEach(museumId => {
    const artists = artistsByMuseum[museumId];
    if (artists) {
      allArtists.push(...artists.slice(0, 3));
    }
  });

  // Remove duplicates and return top 12
  return Array.from(new Set(allArtists)).slice(0, 12);
}

/**
 * Get museum badge info for a painting
 * For Europeana, shows actual museum instead of "Europeana"
 */
export function getMuseumBadgeInfo(painting: Painting): {
  shortName: string;
  color: string;
} {
  // Extract museum ID from painting.id prefix
  let museumId = 'MET'; // default

  if (typeof painting.id === 'string') {
    if (painting.id.startsWith('rijks-')) museumId = 'RIJKS';
    else if (painting.id.startsWith('cleveland-')) museumId = 'CLEVELAND';
    else if (painting.id.startsWith('chicago-')) museumId = 'CHICAGO';
    else if (painting.id.startsWith('harvard-')) museumId = 'HARVARD';
    else if (painting.id.startsWith('va-')) museumId = 'VA';
    else if (painting.id.startsWith('paris-')) museumId = 'PARIS';
    else if (painting.id.startsWith('europeana-')) {
      // For Europeana, use actual museum name
      const displayName = getDisplayMuseumName(painting);
      return {
        shortName: getShortMuseumName(displayName),
        color: '#1E3A8A',
      };
    }
  }

  const museums = getMuseumsByIds([museumId]);
  const museum = museums[0];

  return {
    shortName: museum?.shortName || 'MET',
    color: museum?.color || '#d4af37',
  };
}

/**
 * Get short name for museum (for badges)
 */
function getShortMuseumName(fullName: string): string {
  // Try to create a short abbreviation
  if (fullName.includes('Rijksmuseum')) return 'Rijks';
  if (fullName.includes('Louvre')) return 'Louvre';
  if (fullName.includes('Orsay')) return 'Orsay';
  if (fullName.includes('Museum')) {
    // Extract first word before "Museum"
    const match = fullName.match(/(\w+)\s+Museum/);
    return match ? match[1] : fullName.slice(0, 8);
  }
  // Default: first 8 chars
  return fullName.slice(0, 8);
}