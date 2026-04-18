import { supabase } from './supabase';
import { resolveMuseumId } from './museumCache';
import type { Painting as CachedPainting } from '@/types/database';

/**
 * Get a painting from the cache by UUID, falling back to legacy_id.
 */
export async function getCachedPainting(
  paintingId: string,
): Promise<CachedPainting | null> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('id', paintingId)
    .single();

  if (data) return data;

  // Fallback: try legacy_id for paintings that still have legacy IDs in navigation params
  if (error?.code === 'PGRST116' || !data) {
    const { data: byLegacy } = await supabase
      .from('paintings')
      .select('*')
      .eq('legacy_id', paintingId)
      .single();
    return byLegacy || null;
  }

  if (error) console.error('Error fetching cached painting:', error);
  return null;
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
    console.error(
      'Error caching painting: museum not found for:',
      painting.museumLegacyId,
    );
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
      { onConflict: 'museum_id,external_id' },
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
export async function getCachedPaintings(
  paintingUuids: string[],
): Promise<CachedPainting[]> {
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
