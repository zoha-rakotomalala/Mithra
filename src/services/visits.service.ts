import { supabase } from './supabase';
import { resolveMuseumId } from './museumCache';
import type { Visit } from '@/types/database';

/**
 * Create a new museum visit.
 * @param museumLegacyId - Short museum code, e.g. "MET", "RIJKS"
 */
export async function createVisit(
  museumLegacyId: string,
  visitDate: string,
  notes?: string
): Promise<Visit | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Error creating visit: User is not logged in.');
    return null;
  }

  const museumUuid = await resolveMuseumId(museumLegacyId);
  if (!museumUuid) {
    console.error('Error creating visit: Museum not found for legacy ID:', museumLegacyId);
    return null;
  }

  const { data, error } = await supabase
    .from('visits')
    .insert({
      user_id: user.id,
      museum_id: museumUuid,
      visit_date: visitDate,
      notes,
    })
    .select('*, museum:museums(name, short_name)')
    .single();

  if (error) {
    console.error('Error creating visit:', error);
    return null;
  }

  return data;
}

/**
 * Get all visits for the current user, with museum name joined.
 */
export async function getVisits(): Promise<Visit[]> {
  const { data, error } = await supabase
    .from('visits')
    .select('*, museum:museums(name, short_name)')
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('Error fetching visits:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single visit by ID.
 */
export async function getVisitById(visitId: string): Promise<Visit | null> {
  const { data, error } = await supabase
    .from('visits')
    .select('*, museum:museums(name, short_name)')
    .eq('id', visitId)
    .single();

  if (error) {
    console.error('Error fetching visit:', error);
    return null;
  }

  return data;
}

/**
 * Update visit notes or date.
 */
export async function updateVisit(
  visitId: string,
  updates: Partial<Pick<Visit, 'visit_date' | 'notes'>>
): Promise<Visit | null> {
  const { data, error } = await supabase
    .from('visits')
    .update(updates)
    .eq('id', visitId)
    .select('*, museum:museums(name, short_name)')
    .single();

  if (error) {
    console.error('Error updating visit:', error);
    return null;
  }

  return data;
}

/**
 * Delete a visit.
 */
export async function deleteVisit(visitId: string): Promise<boolean> {
  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', visitId);

  if (error) {
    console.error('Error deleting visit:', error);
    return false;
  }

  return true;
}
