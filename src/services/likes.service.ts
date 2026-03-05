import { supabase } from './supabase';
import type { UserPaintingLike } from '@/types/database';

/**
 * Resolve a legacy text painting ID (e.g. "met-12345") to its UUID in the paintings table.
 * Returns null if not found.
 */
async function resolvePaintingUuid(legacyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('paintings')
    .select('id')
    .eq('legacy_id', legacyId)
    .single();

  if (error || !data) return null;
  return data.id;
}

/**
 * Like a painting during a visit.
 * @param legacyPaintingId - The old text ID, e.g. "met-12345"
 * @param visitId - UUID of the visit
 */
export async function likePainting(
  legacyPaintingId: string,
  visitId: string
): Promise<UserPaintingLike | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Error liking painting: User is not logged in.');
    return null;
  }

  const paintingUuid = await resolvePaintingUuid(legacyPaintingId);
  if (!paintingUuid) {
    console.error('Error liking painting: painting not found in DB for legacy ID:', legacyPaintingId);
    return null;
  }

  const { data, error } = await supabase
    .from('user_painting_likes')
    .insert({
      user_id: user.id,
      painting_id: paintingUuid,
      visit_id: visitId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error liking painting:', error);
    return null;
  }

  return data;
}

/**
 * Unlike a painting.
 * @param legacyPaintingId - The old text ID, e.g. "met-12345"
 */
export async function unlikePainting(legacyPaintingId: string, visitId: string): Promise<boolean> {
  const paintingUuid = await resolvePaintingUuid(legacyPaintingId);
  if (!paintingUuid) {
    console.error('Error unliking painting: painting not found for legacy ID:', legacyPaintingId);
    return false;
  }

  const { error } = await supabase
    .from('user_painting_likes')
    .delete()
    .eq('painting_id', paintingUuid)
    .eq('visit_id', visitId);

  if (error) {
    console.error('Error unliking painting:', error);
    return false;
  }

  return true;
}

/**
 * Get all liked paintings for a visit.
 */
export async function getLikedPaintingsForVisit(visitId: string): Promise<UserPaintingLike[]> {
  const { data, error } = await supabase
    .from('user_painting_likes')
    .select('*')
    .eq('visit_id', visitId)
    .order('liked_at', { ascending: false });

  if (error) {
    console.error('Error fetching liked paintings:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a painting is liked in a visit.
 * @param legacyPaintingId - The old text ID, e.g. "met-12345"
 */
export async function isPaintingLiked(
  legacyPaintingId: string,
  visitId: string
): Promise<boolean> {
  const paintingUuid = await resolvePaintingUuid(legacyPaintingId);
  if (!paintingUuid) return false;

  const { data, error } = await supabase
    .from('user_painting_likes')
    .select('id')
    .eq('painting_id', paintingUuid)
    .eq('visit_id', visitId)
    .single();

  return !error && !!data;
}

/**
 * Get all liked paintings across all visits.
 */
export async function getAllLikedPaintings(): Promise<UserPaintingLike[]> {
  const { data, error } = await supabase
    .from('user_painting_likes')
    .select('*')
    .order('liked_at', { ascending: false });

  if (error) {
    console.error('Error fetching all liked paintings:', error);
    return [];
  }

  return data || [];
}

/**
 * Get the set of legacy painting IDs that are liked for a given visit.
 * Useful for populating UI state without multiple round-trips.
 */
export async function getLikedLegacyIdsForVisit(visitId: string): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('user_painting_likes')
    .select('painting:paintings(legacy_id)')
    .eq('user_id', user.id)
    .eq('visit_id', visitId);

  if (error || !data) return new Set();

  const ids = data
    .map((row: any) => row.painting?.legacy_id)
    .filter(Boolean) as string[];

  return new Set(ids);
}
