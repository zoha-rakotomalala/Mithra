import { supabase } from './supabase';
import type { VisitPalette, CanonPalette } from '@/types/database';

/**
 * Create or update visit palette (8 artworks)
 */
export async function saveVisitPalette(
  visitId: string,
  paintingIds: string[]
): Promise<VisitPalette | null> {
  if (paintingIds.length !== 8) {
    console.error('Visit palette must have exactly 8 artworks');
    return null;
  }

  const { data, error } = await supabase
    .from('visit_palettes')
    .upsert({
      visit_id: visitId,
      painting_ids: paintingIds,
    }, { onConflict: 'visit_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving visit palette:', error);
    return null;
  }

  return data;
}

/**
 * Get visit palette
 */
export async function getVisitPalette(visitId: string): Promise<VisitPalette | null> {
  const { data, error } = await supabase
    .from('visit_palettes')
    .select('*')
    .eq('visit_id', visitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching visit palette:', error);
    return null;
  }

  return data;
}

/**
 * Delete visit palette
 */
export async function deleteVisitPalette(visitId: string): Promise<boolean> {
  const { error } = await supabase
    .from('visit_palettes')
    .delete()
    .eq('visit_id', visitId);

  if (error) {
    console.error('Error deleting visit palette:', error);
    return false;
  }

  return true;
}

/**
 * Create or update canon palette (8 artworks from all visits)
 */
export async function saveCanonPalette(paintingIds: string[]): Promise<CanonPalette | null> {
  if (paintingIds.length !== 8) {
    console.error('Canon palette must have exactly 8 artworks');
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Error saving canon palette: User is not logged in.');
    return null;
  }

  const { data, error } = await supabase
    .from('canon_palettes')
    .upsert({
      user_id: user.id,
      painting_ids: paintingIds,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving canon palette:', error);
    return null;
  }

  return data;
}

/**
 * Get canon palette
 */
export async function getCanonPalette(): Promise<CanonPalette | null> {
  const { data, error } = await supabase
    .from('canon_palettes')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching canon palette:', error);
    return null;
  }

  return data;
}
