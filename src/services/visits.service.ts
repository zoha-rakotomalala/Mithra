import { supabase } from './supabase';
import type { Visit } from '@/types/database';

/**
 * Create a new museum visit
 */
export async function createVisit(
  museumId: string,
  museumName: string,
  visitDate: string,
  notes?: string
): Promise<Visit | null> {

  // 1. GET THE CURRENT USER'S ID
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // CRITICAL: Cannot proceed without an authenticated user.
    console.error('Error creating visit: User is not logged in.');
    return null;
  }

  // 2. INCLUDE user_id IN THE INSERT DATA
  const { data, error } = await supabase
    .from('visits')
    .insert({
      user_id: user.id, // <--- ADD THIS LINE
      museum_id: museumId,
      museum_name: museumName,
      visit_date: visitDate,
      notes,
    })
    .select()
    .single();

  if (error) {
    // The RLS violation error will likely show up here if the user is NULL
    console.error('Error creating visit:', error);
    return null;
  }

  return data;
}

/**
 * Get all visits for current user
 */
export async function getVisits(): Promise<Visit[]> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('Error fetching visits:', error);
    return [];
  }

  return data || [];
}

/**
 * Get single visit by ID
 */
export async function getVisitById(visitId: string): Promise<Visit | null> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('id', visitId)
    .single();

  if (error) {
    console.error('Error fetching visit:', error);
    return null;
  }

  return data;
}

/**
 * Update visit
 */
export async function updateVisit(
  visitId: string,
  updates: Partial<Pick<Visit, 'museum_name' | 'visit_date' | 'notes'>>
): Promise<Visit | null> {
  const { data, error } = await supabase
    .from('visits')
    .update(updates)
    .eq('id', visitId)
    .select()
    .single();

  if (error) {
    console.error('Error updating visit:', error);
    return null;
  }

  return data;
}

/**
 * Delete visit
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
