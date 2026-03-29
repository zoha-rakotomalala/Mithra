import type { Painting } from '@/types/painting';
import {
  getCachedPaintings,
  updateCacheWithFreshResults,
  getCacheFreshness
} from './paintingCacheService';
import { getAdapter } from './museumAdapterRegistry';
// Side-effect imports: each module registers its adapter on load
import './metMuseumService';
import './rijksmuseumService';
import './clevelandService';
import './chicagoService';
import './harvardService';
import './vaService';
import './europeanaService';
import './parisMuseumsService';
import './nationalGalleryService';
import './jocondeService';
import './wikidataService';
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

        // Replace legacy IDs with database UUIDs on in-memory paintings
        for (const painting of freshPaintings) {
          const uuid = updateResult.legacyToUuid[painting.id];
          if (uuid) {
            (painting as any).id = uuid;
          }
        }
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
 * Search a single museum via adapter registry
 */
async function searchSingleMuseumAPI(
  museumId: string,
  query: string,
  searchType: SearchType,
  maxResults: number
): Promise<Painting[]> {
  const adapter = getAdapter(museumId);
  if (!adapter) {
    console.warn(`No adapter registered for museum: ${museumId}`);
    return [];
  }
  const result = await adapter.search({ query, maxResults, searchType });
  return result.paintings;
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
  // Use the painting.museum field to determine the museum badge.
  // This works for both UUID-based paintings (from cache) and legacy-ID paintings (uncached).
  const museumName = (painting.museum || '').toLowerCase();

  // Map museum display names / short codes to registry IDs
  const museumIdMap: Record<string, string> = {
    met: 'MET',
    metropolitan: 'MET',
    rijks: 'RIJKS',
    rijksmuseum: 'RIJKS',
    cleveland: 'CLEVELAND',
    chicago: 'CHICAGO',
    'art institute': 'CHICAGO',
    harvard: 'HARVARD',
    va: 'VA',
    'victoria and albert': 'VA',
    'v&a': 'VA',
    paris: 'PARIS',
    europeana: 'EUROPEANA',
    national: 'NATIONAL_GALLERY',
    joconde: 'JOCONDE',
  };

  let museumId = 'MET'; // default fallback

  // Try matching by museum name
  for (const [key, id] of Object.entries(museumIdMap)) {
    if (museumName.includes(key)) {
      museumId = id;
      break;
    }
  }

  // Fallback: try legacy ID prefix if museum field didn't match
  if (museumId === 'MET' && typeof painting.id === 'string') {
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