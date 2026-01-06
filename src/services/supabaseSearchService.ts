import type { Painting } from '@/types/painting';
import { supabase } from './supabase'; // Your existing supabase client

export type SearchType = 'artist' | 'title';

interface CachedSearchResult {
  id: string;
  query: string;
  search_type: SearchType;
  museum_id: string;
  paintings: Painting[];
  created_at: string;
  updated_at: string;
}

/**
 * Search paintings with Supabase caching
 * 1. Check cache first
 * 2. If not found, query API
 * 3. Store results in cache
 */
export async function searchWithCache(
  query: string,
  searchType: SearchType,
  museumId: string,
  apiFetcher: () => Promise<Painting[]>
): Promise<Painting[]> {
  const normalizedQuery = query.toLowerCase().trim();

  // Try to get from cache first
  const cached = await getCachedSearch(normalizedQuery, searchType, museumId);

  if (cached && cached.length > 0) {
    console.log(`✅ Cache HIT: ${museumId} - ${searchType} - "${query}"`);
    return cached;
  }

  console.log(`❌ Cache MISS: ${museumId} - ${searchType} - "${query}" - Fetching from API...`);

  // Cache miss - fetch from API
  const paintings = await apiFetcher();

  // Store in cache (don't await - fire and forget)
  if (paintings.length > 0) {
    storeCachedSearch(normalizedQuery, searchType, museumId, paintings).catch(err => {
      console.error('Failed to cache search results:', err);
    });
  }

  return paintings;
}

/**
 * Get cached search results
 */
async function getCachedSearch(
  query: string,
  searchType: SearchType,
  museumId: string
): Promise<Painting[] | null> {
  try {
    // 1. Read search cache entry
    const { data: cache, error: cacheError } = await supabase
      .from('search_cache')
      .select('painting_ids, last_verified_at')
      .eq('query', query)
      .eq('search_type', searchType)
      .eq('museum_id', museumId)
      .single();

    if (cacheError) {
      if (cacheError.code === 'PGRST116') return null;
      throw cacheError;
    }

    if (!cache?.painting_ids || cache.painting_ids.length === 0) {
      return null;
    }

    // 2. Fetch actual paintings by ID
    const { data: paintings, error: paintingsError } = await supabase
      .from('paintings')
      .select('*')
      .in('id', cache.painting_ids);

    if (paintingsError) throw paintingsError;

    return paintings.map(convertToPainting);
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Store search results in cache
 */
async function storeCachedSearch(
  query: string,
  searchType: SearchType,
  museumId: string,
  paintings: Painting[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('search_cache')
      .upsert({
        query,
        search_type: searchType,
        museum_id: museumId,
        paintings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'query,search_type,museum_id'
      });

    if (error) throw error;

    console.log(`💾 Cached: ${museumId} - ${searchType} - "${query}" (${paintings.length} results)`);
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't throw - caching failures shouldn't break the search
  }
}

/**
 * Clear old cache entries (run periodically)
 * Removes entries older than 30 days
 */
export async function clearOldCache(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('search_cache')
      .delete()
      .lt('updated_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    console.log('🧹 Cleared old cache entries');
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

/**
 * Invalidate specific cache entry
 */
export async function invalidateCache(
  query: string,
  searchType: SearchType,
  museumId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('search_cache')
      .delete()
      .eq('query', query.toLowerCase().trim())
      .eq('search_type', searchType)
      .eq('museum_id', museumId);

    if (error) throw error;
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}