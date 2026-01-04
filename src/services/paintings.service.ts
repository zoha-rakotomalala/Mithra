import { supabase } from './supabase';
import type { Painting as CachedPainting } from '@/types/database';

/**
 * Get painting from cache
 */
export async function getCachedPainting(paintingId: string): Promise<CachedPainting | null> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('id', paintingId)
    .single();

  if (error) {
    console.error('Error fetching cached painting:', error);
    return null;
  }

  return data;
}

/**
 * Cache painting from museum API
 */
export async function cachePainting(painting: {
  id: string;
  museum_id: string;
  title: string;
  artist: string;
  year?: string;
  image_url?: string;
  metadata?: Record<string, any>;
}): Promise<CachedPainting | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Error caching painting: User is not logged in.');
    return null;
  }

  const { data, error } = await supabase
    .from('paintings')
    .upsert({ ...painting, user_id: user.id }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error caching painting:', error);
    return null;
  }

  return data;
}

/**
 * Get multiple paintings from cache
 */
export async function getCachedPaintings(paintingIds: string[]): Promise<CachedPainting[]> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .in('id', paintingIds);

  if (error) {
    console.error('Error fetching cached paintings:', error);
    return [];
  }

  return data || [];
}
