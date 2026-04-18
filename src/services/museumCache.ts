import { supabase } from './supabase';
import type { Museum } from '@/types/database';

/**
 * In-memory cache of museums keyed by their legacy short ID (e.g. "MET", "RIJKS").
 * Populated lazily on first use.
 */
let museumsByLegacyId: Record<string, Museum> | null = null;

export async function getMuseumMap(): Promise<Record<string, Museum>> {
  if (museumsByLegacyId) return museumsByLegacyId;

  const { data, error } = await supabase
    .from('museums')
    .select('*')
    .eq('is_active', true);

  if (error || !data) {
    console.error('Failed to load museums:', error);
    return {};
  }

  museumsByLegacyId = {};
  for (const museum of data) {
    const legacyId = museum.metadata?.legacyId as string | undefined;
    if (legacyId) {
      museumsByLegacyId[legacyId] = museum;
    }
  }

  return museumsByLegacyId;
}

/** Resolve a legacy short code (e.g. "MET") to a museum UUID. */
export async function resolveMuseumId(
  legacyId: string,
): Promise<string | null> {
  const map = await getMuseumMap();
  return map[legacyId]?.id ?? null;
}

/** Clear the cache (useful in tests or after museum config changes). */
export function clearMuseumCache(): void {
  museumsByLegacyId = null;
}
