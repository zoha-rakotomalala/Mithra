import type { Painting } from '@/types/painting';

import { searchChicago } from './chicagoService';
import { searchCleveland } from './clevelandService';
import { searchEuropeana } from './europeanaService';
import { searchHarvard } from './harvardService';
import { searchMetMuseum } from './metMuseumService';
import { getMuseumsByIds, type MuseumConfig } from './museumRegistry';
import { searchParisMuseums } from './parisMuseumsService';
import { searchRijksmuseum } from './rijksmuseumService';
import {
  cleanArtistName,
  filterByQuality,
  getDisplayMuseumName,
  type QualityFilter,
  removeDuplicates,
  sortByRelevance,
} from './searchHelpers';
import { searchVA } from './vaService';

export type UnifiedSearchParams = {
  maxResultsPerMuseum?: number;
  museumIds: string[];
  qualityFilters?: QualityFilter;
  query: string;
}

export type UnifiedSearchResult = {
  paintings: Painting[];
  resultsByMuseum: Record<string, number>;
  totalResults: number;
}

/**
 * Search across multiple museums with smart filtering and relevance sorting
 */
export async function searchAllMuseums(
  parameters: UnifiedSearchParams
): Promise<UnifiedSearchResult> {
  const {
    maxResultsPerMuseum = 20,
    museumIds,
    qualityFilters = {
      minRelevanceScore: 15,
      paintingsOnly: true,
      requireArtist: true,
      requireImage: true,
    },
    query
  } = parameters;

  if (!query || query.trim().length === 0) {
    return {
      paintings: [],
      resultsByMuseum: {},
      totalResults: 0
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

  for (const [index, result] of results.entries()) {
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
  }

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
    resultsByMuseum,
    totalResults: allPaintings.length,
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
      case 'CHICAGO': {
        const chicagoResult = await searchChicago({
          limit: maxResults,
          query
        });
        return { paintings: chicagoResult.paintings };
      }

      case 'CLEVELAND': {
        const clevelandResult = await searchCleveland({
          limit: maxResults,
          query
        });
        return { paintings: clevelandResult.paintings };
      }

      case 'EUROPEANA': {
        const europeanaResult = await searchEuropeana({
          query,
          rows: maxResults
        });
        return { paintings: europeanaResult.paintings };
      }

      case 'HARVARD': {
        const harvardResult = await searchHarvard({
          query,
          size: maxResults
        });
        return { paintings: harvardResult.paintings };
      }

      case 'MET': {
        const metResult = await searchMetMuseum({ hasImages: true, query });
        return {
          paintings: metResult.paintings.slice(0, maxResults)
        };
      }

      case 'PARIS': {
        const parisResult = await searchParisMuseums({
          limit: maxResults,
          query
        });
        return { paintings: parisResult.paintings };
      }

      case 'RIJKS': {
        const rijksResult = await searchRijksmuseum({
          limit: maxResults,
          query
        });
        return { paintings: rijksResult.paintings };
      }

      case 'VA': {
        const vaResult = await searchVA({
          pageSize: maxResults,
          query
        });
        return { paintings: vaResult.paintings };
      }

      default: {
        console.warn(`Unknown or disabled museum ID: ${museumId}`);
        return { paintings: [] };
      }
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
    CHICAGO: ['Georges Seurat', 'Vincent van Gogh', 'Henri de Toulouse-Lautrec'],
    CLEVELAND: ['Pablo Picasso', 'Claude Monet', 'El Greco'],
    EUROPEANA: ['Vermeer', 'Monet', 'Van Gogh'],
    HARVARD: ['Rembrandt', 'Pablo Picasso', 'Albrecht Dürer'],
    MET: ['Vincent van Gogh', 'Claude Monet', 'Rembrandt'],
    PARIS: ['Auguste Rodin', 'Eugène Delacroix', 'Gustave Courbet'],
    RIJKS: ['Rembrandt', 'Johannes Vermeer', 'Frans Hals'],
    VA: ['John Constable', 'J.M.W. Turner', 'Raphael'],
  };

  for (const museumId of museumIds) {
    const artists = artistsByMuseum[museumId];
    if (artists) {
      allArtists.push(...artists.slice(0, 3));
    }
  }

  // Remove duplicates and return top 12
  return [...new Set(allArtists)].slice(0, 12);
}

/**
 * Get museum badge info for a painting
 * For Europeana, shows actual museum instead of "Europeana"
 */
export function getMuseumBadgeInfo(painting: Painting): {
  color: string;
  shortName: string;
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
        color: '#1E3A8A',
        shortName: getShortMuseumName(displayName),
      };
    }
  }

  const museums = getMuseumsByIds([museumId]);
  const museum = museums[0];

  return {
    color: museum?.color || '#d4af37',
    shortName: museum?.shortName || 'MET',
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
    const match = /(\w+)\s+Museum/.exec(fullName);
    return match ? match[1] : fullName.slice(0, 8);
  }
  // Default: first 8 chars
  return fullName.slice(0, 8);
}