import type { Painting } from '@/types/painting';
import {
  getCachedPaintings,
  updateCacheWithFreshResults,
  getCacheFreshness
} from './paintingCacheService';
import { searchMetMuseum } from './metMuseumService';
import { searchRijksmuseum } from './rijksmuseumService';
import { searchCleveland } from './clevelandService';
import { searchChicago } from './chicagoService';
import { searchHarvard } from './harvardService';
import { searchVA } from './vaService';
import { searchEuropeana } from './europeanaService';
import { searchParisMuseums } from './parisMuseumsService';
import { getMuseumsByIds } from './museumRegistry';
import {
  cleanArtistName,
  sortByRelevance,
  removeDuplicates,
  filterByQuality,
  getDisplayMuseumName,
  type QualityFilter,
} from './utils/searchHelpers';

export type SearchType = 'artist' | 'title';

export interface UnifiedSearchParams {
  query: string;
  searchType: SearchType;
  museumIds: string[];
  maxResultsPerMuseum?: number;
  qualityFilters?: QualityFilter;
  useCache?: boolean;
  onProgressUpdate?: (update: ProgressUpdate) => void;
}

export interface ProgressUpdate {
  phase: 'cache' | 'api' | 'complete';
  museumId?: string;
  cached?: number;
  fresh?: number;
  added?: number;
  updated?: number;
}

export interface UnifiedSearchResult {
  paintings: Painting[];
  totalResults: number;
  resultsByMuseum: Record<string, number>;
  cacheStats: {
    hits: number;
    misses: number;
    stale: number;
  };
  updateStats: {
    added: number;
    updated: number;
  };
}

/**
 * Progressive Enhancement Search
 *
 * Flow:
 * 1. Return cached results immediately (phase: cache)
 * 2. Query APIs in background (phase: api)
 * 3. Update cache and return fresh results (phase: complete)
 */
export async function searchAllMuseums(
  params: UnifiedSearchParams
): Promise<UnifiedSearchResult> {
  const {
    query,
    searchType,
    museumIds,
    maxResultsPerMuseum = 20,
    useCache = true,
    onProgressUpdate,
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
      resultsByMuseum: {},
      cacheStats: { hits: 0, misses: 0, stale: 0 },
      updateStats: { added: 0, updated: 0 },
    };
  }

  console.log(`🔍 Progressive search: "${query}" (${searchType}) across ${museumIds.length} museums`);

  const cacheStats = { hits: 0, misses: 0, stale: 0 };
  const updateStats = { added: 0, updated: 0 };

  // PHASE 1: Get cached results immediately
  let cachedPaintings: Painting[] = [];

  if (useCache) {
    const cachePromises = museumIds.map(async (museumId) => {
      const cached = await getCachedPaintings(museumId, query, searchType);
      if (cached.length > 0) {
        cacheStats.hits++;

        // Check if cache is stale
        const freshness = await getCacheFreshness(museumId, query, searchType);
        if (freshness.shouldRevalidate) {
          cacheStats.stale++;
        }

        return { museumId, paintings: cached };
      } else {
        cacheStats.misses++;
        return { museumId, paintings: [] };
      }
    });

    const cacheResults = await Promise.all(cachePromises);
    cachedPaintings = cacheResults.flatMap(r => r.paintings);

    if (cachedPaintings.length > 0) {
      console.log(`💨 Showing ${cachedPaintings.length} cached results (${cacheStats.hits} hits, ${cacheStats.misses} misses, ${cacheStats.stale} stale)`);

      // Notify: Showing cached results
      onProgressUpdate?.({
        phase: 'cache',
        cached: cachedPaintings.length,
      });
    }
  }

  // PHASE 2: Query APIs for fresh data
  console.log(`🌐 Fetching fresh data from ${museumIds.length} museum APIs...`);

  const apiPromises = museumIds.map(async (museumId) => {
    try {
      // Notify: Starting API call
      onProgressUpdate?.({
        phase: 'api',
        museumId,
      });

      const freshPaintings = await searchSingleMuseumAPI(
        museumId,
        query,
        searchType,
        maxResultsPerMuseum
      );

      // Update cache with fresh results
      if (useCache) {
        const updateResult = await updateCacheWithFreshResults(
          museumId,
          query,
          searchType,
          freshPaintings
        );

        updateStats.added += updateResult.added;
        updateStats.updated += updateResult.updated;
      }

      return { museumId, paintings: freshPaintings };
    } catch (error) {
      console.error(`❌ ${museumId} API failed:`, error);
      return { museumId, paintings: [] };
    }
  });

  // Wait for all API calls
  const apiResults = await Promise.all(apiPromises);

  // PHASE 3: Combine and process fresh results
  let allPaintings = apiResults.flatMap(r => r.paintings);
  const resultsByMuseum: Record<string, number> = {};

  apiResults.forEach(({ museumId, paintings }) => {
    resultsByMuseum[museumId] = paintings.length;
  });

  console.log(`📊 API results: ${allPaintings.length} paintings`);
  console.log(`📊 Cache updates: +${updateStats.added} new, ~${updateStats.updated} updated`);

  // Clean artist names
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

  // Notify: Search complete
  onProgressUpdate?.({
    phase: 'complete',
    fresh: allPaintings.length,
    added: updateStats.added,
    updated: updateStats.updated,
  });

  console.log(`✅ Search complete: ${allPaintings.length} paintings`);

  return {
    paintings: allPaintings,
    totalResults: allPaintings.length,
    resultsByMuseum,
    cacheStats,
    updateStats,
  };
}

/**
 * Search a single museum via API
 */
async function searchSingleMuseumAPI(
  museumId: string,
  query: string,
  searchType: SearchType,
  maxResults: number
): Promise<Painting[]> {
  const searchQuery = query;

  switch (museumId) {
    case 'MET':
      const metResult = await searchMetMuseum({
        query: searchQuery,
        hasImages: true,
        artistOrCulture: searchType === 'artist',
      });
      return metResult.paintings.slice(0, maxResults);

    case 'RIJKS':
      const rijksResult = await searchRijksmuseum({
        query: searchQuery,
        limit: maxResults,
        involvedMaker: searchType === 'artist' ? searchQuery : undefined,
      });
      return rijksResult.paintings;

    case 'CLEVELAND':
      const clevelandResult = await searchCleveland({
        query: searchQuery,
        limit: maxResults,
      });
      return clevelandResult.paintings;

    case 'CHICAGO':
      const chicagoResult = await searchChicago({
        query: searchQuery,
        limit: maxResults,
      });
      return chicagoResult.paintings;

    case 'HARVARD':
      const harvardResult = await searchHarvard({
        query: searchQuery,
        size: maxResults,
      });
      return harvardResult.paintings;

    case 'VA':
      const vaResult = await searchVA({
        query: searchQuery,
        pageSize: maxResults,
      });
      return vaResult.paintings;

    case 'EUROPEANA':
      const europeanaResult = await searchEuropeana({
        query: searchQuery,
        rows: maxResults,
      });
      return europeanaResult.paintings;

    case 'PARIS':
      const parisResult = await searchParisMuseums({
        query: searchQuery,
        limit: maxResults,
      });
      return parisResult.paintings;

    default:
      console.warn(`Unknown museum ID: ${museumId}`);
      return [];
  }
}

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

  return Array.from(new Set(allArtists)).slice(0, 12);
}

export function getMuseumBadgeInfo(painting: Painting): {
  shortName: string;
  color: string;
} {
  let museumId = 'MET';

  if (typeof painting.id === 'string') {
    if (painting.id.startsWith('rijks-')) museumId = 'RIJKS';
    else if (painting.id.startsWith('cleveland-')) museumId = 'CLEVELAND';
    else if (painting.id.startsWith('chicago-')) museumId = 'CHICAGO';
    else if (painting.id.startsWith('harvard-')) museumId = 'HARVARD';
    else if (painting.id.startsWith('va-')) museumId = 'VA';
    else if (painting.id.startsWith('paris-')) museumId = 'PARIS';
    else if (painting.id.startsWith('europeana-')) {
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

function getShortMuseumName(fullName: string): string {
  if (fullName.includes('Rijksmuseum')) return 'Rijks';
  if (fullName.includes('Louvre')) return 'Louvre';
  if (fullName.includes('Orsay')) return 'Orsay';
  if (fullName.includes('Museum')) {
    const match = fullName.match(/(\w+)\s+Museum/);
    return match ? match[1] : fullName.slice(0, 8);
  }
  return fullName.slice(0, 8);
}