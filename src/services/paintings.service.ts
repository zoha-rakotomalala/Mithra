import { supabase } from './supabase';
import { resolveMuseumId } from './museumCache';
import type { Painting as CachedPainting } from '@/types/database';

/**
 * Get a painting from the cache by its UUID.
 */
export async function getCachedPainting(paintingUuid: string): Promise<CachedPainting | null> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('id', paintingUuid)
    .single();

  if (error) {
    console.error('Error fetching cached painting:', error);
    return null;
  }

  return data;
}

/**
 * Get a painting by its legacy text ID (e.g. "met-12345").
 */
export async function getCachedPaintingByLegacyId(legacyId: string): Promise<CachedPainting | null> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('legacy_id', legacyId)
    .single();

  if (error) {
    console.error('Error fetching painting by legacy ID:', error);
    return null;
  }

  return data;
}

/**
 * Cache a painting from a museum API.
 * Uses (museum_id, external_id) as the upsert key.
 * @param painting.museumLegacyId - Short museum code, e.g. "MET"
 * @param painting.externalId - The ID portion after the prefix, e.g. "12345"
 */
export async function cachePainting(painting: {
  museumLegacyId: string;
  externalId: string;
  legacyId?: string;
  title: string;
  artist: string;
  year?: string;
  image_url?: string;
  thumbnail_url?: string;
  medium?: string;
  dimensions?: string;
  color?: string;
  metadata?: Record<string, any>;
}): Promise<CachedPainting | null> {
  const museumUuid = await resolveMuseumId(painting.museumLegacyId);
  if (!museumUuid) {
    console.error('Error caching painting: museum not found for:', painting.museumLegacyId);
    return null;
  }

  const { data, error } = await supabase
    .from('paintings')
    .upsert(
      {
        museum_id: museumUuid,
        external_id: painting.externalId,
        legacy_id: painting.legacyId,
        title: painting.title,
        artist: painting.artist,
        year: painting.year,
        image_url: painting.image_url,
        thumbnail_url: painting.thumbnail_url,
        medium: painting.medium,
        dimensions: painting.dimensions,
        color: painting.color,
        metadata: painting.metadata,
      },
      { onConflict: 'museum_id,external_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error caching painting:', error);
    return null;
  }

  return data;
}

/**
 * Get multiple paintings from the cache by their UUIDs.
 */
export async function getCachedPaintings(paintingUuids: string[]): Promise<CachedPainting[]> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .in('id', paintingUuids);

  if (error) {
    console.error('Error fetching cached paintings:', error);
    return [];
  }

  return data || [];
}
