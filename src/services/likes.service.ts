import { supabase } from './supabase';
import type { UserPaintingLike } from '@/types/database';

/**
 * Like a painting during a visit.
 * @param paintingUuid - The painting's database UUID
 * @param visitId - UUID of the visit
 */
export async function likePainting(
  paintingUuid: string,
  visitId: string
): Promise<UserPaintingLike | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Error liking painting: User is not logged in.');
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
 * @param paintingUuid - The painting's database UUID
 * @param visitId - UUID of the visit
 */
export async function unlikePainting(paintingUuid: string, visitId: string): Promise<boolean> {
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
 * @param paintingUuid - The painting's database UUID
 * @param visitId - UUID of the visit
 */
export async function isPaintingLiked(
  paintingUuid: string,
  visitId: string
): Promise<boolean> {
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
 * Get the set of painting UUIDs that are liked for a given visit.
 * Returns painting UUIDs directly from user_painting_likes.painting_id.
 */
export async function getLikedUuidsForVisit(visitId: string): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('user_painting_likes')
    .select('painting_id')
    .eq('user_id', user.id)
    .eq('visit_id', visitId);

  if (error || !data) return new Set();

  const ids = data.map((row: any) => row.painting_id).filter(Boolean) as string[];

  return new Set(ids);
}
