import { supabase } from './supabase';
import type { VisitPalette, VisitPalettePainting, CanonPalette } from '@/types/database';

export interface VisitPaletteWithPaintings {
  palette: VisitPalette;
  paintings: VisitPalettePainting[];
}

/**
 * Save (create or replace) a visit palette of exactly 8 paintings.
 * @param visitId - UUID of the visit
 * @param paintingUuids - Array of 8 painting UUIDs
 */
export async function saveVisitPalette(
  visitId: string,
  paintingUuids: string[]
): Promise<VisitPalette | null> {
  if (paintingUuids.length !== 8) {
    console.error('Visit palette must have exactly 8 artworks');
    return null;
  }

  // Upsert the palette header row
  const { data: palette, error: paletteError } = await supabase
    .from('visit_palettes')
    .upsert({ visit_id: visitId }, { onConflict: 'visit_id' })
    .select()
    .single();

  if (paletteError || !palette) {
    console.error('Error upserting visit palette:', paletteError);
    return null;
  }

  // Replace all paintings for this palette
  const { error: deleteError } = await supabase
    .from('visit_palette_paintings')
    .delete()
    .eq('palette_id', palette.id);

  if (deleteError) {
    console.error('Error clearing palette paintings:', deleteError);
    return null;
  }

  const rows = paintingUuids.map((painting_id, position) => ({
    palette_id: palette.id,
    painting_id,
    position,
  }));

  const { error: insertError } = await supabase
    .from('visit_palette_paintings')
    .insert(rows);

  if (insertError) {
    console.error('Error inserting palette paintings:', insertError);
    return null;
  }

  return palette;
}

/**
 * Get a visit palette with its ordered paintings.
 */
export async function getVisitPalette(visitId: string): Promise<VisitPaletteWithPaintings | null> {
  const { data, error } = await supabase
    .from('visit_palettes')
    .select('*, visit_palette_paintings(*)')
    .eq('visit_id', visitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching visit palette:', error);
    return null;
  }

  const paintings: VisitPalettePainting[] = (data.visit_palette_paintings || [])
    .sort((a: VisitPalettePainting, b: VisitPalettePainting) => a.position - b.position);

  return {
    palette: {
      id: data.id,
      visit_id: data.visit_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    paintings,
  };
}

/**
 * Delete a visit palette (cascade deletes its paintings via FK).
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
 * Create or update the canon palette (8 paintings from across all visits).
 * @param paintingUuids - Array of 8 painting UUIDs
 */
export async function saveCanonPalette(paintingUuids: string[]): Promise<CanonPalette | null> {
  if (paintingUuids.length !== 8) {
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
    .upsert(
      { user_id: user.id, painting_ids: paintingUuids },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving canon palette:', error);
    return null;
  }

  return data;
}

/**
 * Get the current user's canon palette.
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
