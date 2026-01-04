import { supabase } from './supabase';
import type { UserPaintingLike } from '@/types/database';

/**
 * Like a painting during a visit
 */
export async function likePainting(
  paintingId: string,
  visitId: string,
  paintingData?: {
    museum_id: string;
    title: string;
    artist: string;
    year?: string;
    image_url?: string;
    metadata?: any;
  }
): Promise<UserPaintingLike | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Error liking painting: User is not logged in.');
    return null;
  }

  // ✅ STEP 1: Ensure painting exists in database (if paintingData provided)
  if (paintingData) {
    const { error: paintingError } = await supabase
      .from('paintings')
      .upsert({
        id: paintingId,
        museum_id: paintingData.museum_id,
        title: paintingData.title,
        artist: paintingData.artist,
        year: paintingData.year,
        image_url: paintingData.image_url,
        metadata: paintingData.metadata,
      }, {
        onConflict: 'id',
        ignoreDuplicates: true
      });

    if (paintingError) {
      console.error('Error upserting painting:', paintingError);
      // Continue anyway - painting might already exist
    }
  }

  // ✅ STEP 2: Create the like relationship
  const { data, error } = await supabase
    .from('user_painting_likes')
    .insert({
      user_id: user.id,
      painting_id: paintingId,
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
 * Unlike a painting
 */
export async function unlikePainting(paintingId: string, visitId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_painting_likes')
    .delete()
    .eq('painting_id', paintingId)
    .eq('visit_id', visitId);

  if (error) {
    console.error('Error unliking painting:', error);
    return false;
  }

  return true;
}

/**
 * Get all liked paintings for a visit
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
 * Check if painting is liked in a visit
 */
export async function isPaintingLiked(
  paintingId: string,
  visitId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_painting_likes')
    .select('id')
    .eq('painting_id', paintingId)
    .eq('visit_id', visitId)
    .single();

  return !error && !!data;
}

/**
 * Get all liked paintings across all visits
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
