import { MMKV } from 'react-native-mmkv';

/**
 * The last few queries the user searched, most recent first. Shown on the
 * empty Search screen in place of the old hard-coded "popular artists",
 * so what is offered is honest about where it came from.
 */
const storage = new MMKV({ id: 'recent-searches' });
const KEY = 'queries';
export const MAX_RECENT_SEARCHES = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((q): q is string => typeof q === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Put `query` at the front, dropping an earlier copy of it (case- and
 * whitespace-insensitive) and anything past the cap. Returns the new list.
 */
export function clearRecentSearches(): void {
  storage.delete(KEY);
}

export function rememberSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();
  const key = trimmed.toLowerCase();
  const rest = getRecentSearches().filter((q) => q.toLowerCase() !== key);
  const next = [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES);
  storage.set(KEY, JSON.stringify(next));
  return next;
}
