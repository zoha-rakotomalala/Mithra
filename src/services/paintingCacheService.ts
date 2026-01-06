import type { Painting } from '@/types/painting';
import { supabase } from '@/services/supabase';

/**
 * Progressive Enhancement Cache
 *
 * Strategy:
 * 1. Return cached results immediately (fast UX)
 * 2. Query APIs to get fresh data
 * 3. Update cache with new/changed paintings
 * 4. Notify UI of updates
 *
 * Cache is NOT the source of truth - APIs are!
 */

/**
 * Get cached paintings for instant display
 * These are "stale-while-revalidate" results
 */
export async function getCachedPaintings(
  museumId: string,
  searchQuery: string,
  searchType: 'artist' | 'title'
): Promise<Painting[]> {
  try {
    const query = searchQuery.toLowerCase().trim();

    // First, check if we have a search_cache entry
    const { data: cacheEntry, error: cacheError } = await supabase
      .from('search_cache')
      .select('painting_ids, last_verified_at')
      .eq('query', query)
      .eq('search_type', searchType)
      .eq('museum_id', museumId)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      throw cacheError;
    }

    if (cacheEntry && cacheEntry.painting_ids.length > 0) {
      // Get the actual paintings
      const { data: paintings, error: paintingsError } = await supabase
        .from('paintings')
        .select('*')
        .in('id', cacheEntry.painting_ids);

      if (paintingsError) throw paintingsError;

      if (paintings && paintings.length > 0) {
        const cacheAge = Date.now() - new Date(cacheEntry.last_verified_at).getTime();
        const cacheAgeHours = Math.round(cacheAge / (1000 * 60 * 60));

        console.log(`✅ Cache HIT: ${museumId} - ${searchType} - "${query}" (${paintings.length} paintings, ${cacheAgeHours}h old)`);

        return paintings.map(p => convertToPainting(p));
      }
    }

    console.log(`❌ Cache MISS: ${museumId} - ${searchType} - "${query}"`);
    return [];
  } catch (error) {
    console.error('Error reading from cache:', error);
    return [];
  }
}

/**
 * Update cache with fresh API results
 * Handles new paintings, updated paintings, and removed paintings
 */
export async function updateCacheWithFreshResults(
  museumId: string,
  searchQuery: string,
  searchType: 'artist' | 'title',
  freshPaintings: Painting[]
): Promise<{
  added: number;
  updated: number;
  unchanged: number;
}> {
  try {
    const query = searchQuery.toLowerCase().trim();
    const stats = { added: 0, updated: 0, unchanged: 0 };

    if (freshPaintings.length === 0) {
      console.log(`📝 No results to cache for ${museumId} - "${query}"`);
      return stats;
    }

    // Get current cached painting IDs for this search
    const { data: currentCache } = await supabase
      .from('search_cache')
      .select('painting_ids')
      .eq('query', query)
      .eq('search_type', searchType)
      .eq('museum_id', museumId)
      .single();

    const currentIds = new Set(currentCache?.painting_ids || []);
    const freshIds = freshPaintings.map(p => p.id);

    // Determine what changed
    const newPaintings = freshPaintings.filter(p => !currentIds.has(p.id));
    const existingPaintings = freshPaintings.filter(p => currentIds.has(p.id));

    // Convert to database format
    const dbPaintings = freshPaintings.map(painting => {
      // Preserve ALL original painting data in metadata
      const metadata: any = {
        description: painting.description,
        medium: painting.medium,
        dimensions: painting.dimensions,
        location: painting.location,
        museum: painting.museum,
        objectURL: painting.objectURL,
        period: painting.period,
        culture: painting.culture,
        department: painting.department,
      };

      // For Chicago paintings, preserve image_id for URL reconstruction
      if (typeof painting.id === 'string' && painting.id.startsWith('chicago-')) {
        // Extract image_id from the painting data
        const paintingAny = painting as any;
        if (paintingAny.image_id) {
          metadata.image_id = paintingAny.image_id;
        }
      }

      return {
        id: painting.id,
        museum_id: extractMuseumId(painting.id),
        title: painting.title,
        artist: painting.artist,
        year: painting.year || null,
        image_url: painting.imageUrl || null,
        thumbnail_url: painting.thumbnailUrl || null,
        color: painting.color || '#cccccc',
        metadata,
        last_verified_at: new Date().toISOString(),
        verification_status: 'verified',
        verification_source: 'api',
        cached_at: currentIds.has(painting.id) ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Upsert paintings (batch of 50)
    const batchSize = 50;
    for (let i = 0; i < dbPaintings.length; i += batchSize) {
      const batch = dbPaintings.slice(i, i + batchSize);

      const { error } = await supabase
        .from('paintings')
        .upsert(batch, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Error upserting paintings batch:', error);
      }
    }

    stats.added = newPaintings.length;
    stats.updated = existingPaintings.length;
    stats.unchanged = 0;

    // Update search_cache entry
    await supabase
      .from('search_cache')
      .upsert({
        query,
        search_type: searchType,
        museum_id: museumId,
        painting_ids: freshIds,
        last_verified_at: new Date().toISOString(),
        verification_status: 'fresh',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'query,search_type,museum_id',
      });

    console.log(`💾 Cache updated: ${museumId} - "${query}" (+${stats.added} new, ~${stats.updated} updated)`);

    return stats;
  } catch (error) {
    console.error('Error updating cache:', error);
    return { added: 0, updated: 0, unchanged: 0 };
  }
}

/**
 * Get cache freshness info
 * Helps decide whether to show a "Refreshing..." indicator
 */
export async function getCacheFreshness(
  museumId: string,
  searchQuery: string,
  searchType: 'artist' | 'title'
): Promise<{
  exists: boolean;
  ageMinutes: number;
  shouldRevalidate: boolean;
}> {
  try {
    const query = searchQuery.toLowerCase().trim();

    const { data, error } = await supabase
      .from('search_cache')
      .select('last_verified_at')
      .eq('query', query)
      .eq('search_type', searchType)
      .eq('museum_id', museumId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return { exists: false, ageMinutes: Infinity, shouldRevalidate: true };
    }

    const ageMs = Date.now() - new Date(data.last_verified_at).getTime();
    const ageMinutes = Math.floor(ageMs / (1000 * 60));

    // Revalidate if older than 24 hours
    const shouldRevalidate = ageMinutes > 24 * 60;

    return { exists: true, ageMinutes, shouldRevalidate };
  } catch (error) {
    console.error('Error checking cache freshness:', error);
    return { exists: false, ageMinutes: Infinity, shouldRevalidate: true };
  }
}

/**
 * Mark old cache entries as stale (for background cleanup)
 * Don't delete - just mark as needing revalidation
 */
export async function markStaleCacheEntries(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('search_cache')
      .update({ verification_status: 'stale' })
      .lt('last_verified_at', cutoffDate.toISOString())
      .eq('verification_status', 'fresh')
      .select('id');

    if (error) throw error;

    const markedCount = data?.length || 0;
    console.log(`📋 Marked ${markedCount} cache entries as stale (older than ${daysOld} days)`);
    return markedCount;
  } catch (error) {
    console.error('Error marking stale cache:', error);
    return 0;
  }
}

/**
 * Optional: Delete very old paintings that are no longer referenced
 * Only delete if not in any search_cache.painting_ids
 */
export async function cleanupOrphanedPaintings(daysOld: number = 180): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // This is a complex query - might need to do it in multiple steps
    // For now, just log what would be deleted
    const { data: oldPaintings } = await supabase
      .from('paintings')
      .select('id')
      .lt('cached_at', cutoffDate.toISOString());

    if (!oldPaintings || oldPaintings.length === 0) {
      return 0;
    }

    // Check which are still referenced in search_cache
    const { data: allCaches } = await supabase
      .from('search_cache')
      .select('painting_ids');

    const referencedIds = new Set(
      allCaches?.flatMap(c => c.painting_ids) || []
    );

    const orphanedIds = oldPaintings
      .map(p => p.id)
      .filter(id => !referencedIds.has(id));

    if (orphanedIds.length === 0) {
      return 0;
    }

    // Delete orphaned paintings
    const { error } = await supabase
      .from('paintings')
      .delete()
      .in('id', orphanedIds);

    if (error) throw error;

    console.log(`🧹 Deleted ${orphanedIds.length} orphaned paintings (older than ${daysOld} days)`);
    return orphanedIds.length;
  } catch (error) {
    console.error('Error cleaning orphaned paintings:', error);
    return 0;
  }
}

/**
 * Get a single painting by ID
 */
export async function getCachedPaintingById(paintingId: string): Promise<Painting | null> {
  try {
    const { data, error } = await supabase
      .from('paintings')
      .select('*')
      .eq('id', paintingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? convertToPainting(data) : null;
  } catch (error) {
    console.error('Error getting cached painting:', error);
    return null;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalPaintings: number;
  totalSearches: number;
  paintingsByMuseum: Record<string, number>;
  searchesByMuseum: Record<string, number>;
  freshSearches: number;
  staleSearches: number;
}> {
  try {
    // Paintings count
    const { count: totalPaintings } = await supabase
      .from('paintings')
      .select('*', { count: 'exact', head: true });

    // Search cache count
    const { count: totalSearches } = await supabase
      .from('search_cache')
      .select('*', { count: 'exact', head: true });

    // Fresh vs stale
    const { count: freshSearches } = await supabase
      .from('search_cache')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'fresh');

    const { count: staleSearches } = await supabase
      .from('search_cache')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'stale');

    // Count by museum
    const { data: museumPaintings } = await supabase
      .from('paintings')
      .select('museum_id');

    const paintingsByMuseum: Record<string, number> = {};
    museumPaintings?.forEach(p => {
      paintingsByMuseum[p.museum_id] = (paintingsByMuseum[p.museum_id] || 0) + 1;
    });

    const { data: museumSearches } = await supabase
      .from('search_cache')
      .select('museum_id');

    const searchesByMuseum: Record<string, number> = {};
    museumSearches?.forEach(s => {
      searchesByMuseum[s.museum_id] = (searchesByMuseum[s.museum_id] || 0) + 1;
    });

    return {
      totalPaintings: totalPaintings || 0,
      totalSearches: totalSearches || 0,
      paintingsByMuseum,
      searchesByMuseum,
      freshSearches: freshSearches || 0,
      staleSearches: staleSearches || 0,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalPaintings: 0,
      totalSearches: 0,
      paintingsByMuseum: {},
      searchesByMuseum: {},
      freshSearches: 0,
      staleSearches: 0,
    };
  }
}

/**
 * Helper: Extract museum ID from painting ID
 */
function extractMuseumId(paintingId: string | number): string {
  // Convert to string first
  const id = String(paintingId);

  if (!id) return 'UNKNOWN';

  // Check prefixed IDs
  if (id.startsWith('met-')) return 'MET';
  if (id.startsWith('rijks-')) return 'RIJKS';
  if (id.startsWith('cleveland-')) return 'CLEVELAND';
  if (id.startsWith('chicago-')) return 'CHICAGO';
  if (id.startsWith('harvard-')) return 'HARVARD';
  if (id.startsWith('va-')) return 'VA';
  if (id.startsWith('paris-')) return 'PARIS';
  if (id.startsWith('europeana-')) return 'EUROPEANA';

  // MET uses numeric IDs without prefix - if it's just a number, it's MET
  if (/^\d+$/.test(id)) return 'MET';

  return 'UNKNOWN';
}

/**
 * Helper: Convert database painting to Painting type
 */
function convertToPainting(dbPainting: any): Painting {
  const metadata = dbPainting.metadata || {};

  let imageUrl = dbPainting.image_url;
  let thumbnailUrl = dbPainting.thumbnail_url;

  // For Chicago paintings, reconstruct image URLs if missing
  if (!imageUrl && metadata.image_id && typeof dbPainting.id === 'string' && dbPainting.id.startsWith('chicago-')) {
    const imageId = metadata.image_id;
    imageUrl = `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`;
    thumbnailUrl = `https://www.artic.edu/iiif/2/${imageId}/full/200,/0/default.jpg`;

    console.log('🔧 Reconstructed Chicago image URLs for:', dbPainting.title);
  }

  return {
    id: dbPainting.id,
    title: dbPainting.title,
    artist: dbPainting.artist,
    year: dbPainting.year,
    imageUrl,
    thumbnailUrl,
    color: dbPainting.color,
    museum: metadata.museum || dbPainting.museum_id,
    description: metadata.description,
    medium: metadata.medium,
    dimensions: metadata.dimensions,
    location: metadata.location,
    objectURL: metadata.objectURL,
    period: metadata.period,
    culture: metadata.culture,
    department: metadata.department,
  };
}