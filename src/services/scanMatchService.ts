import type { Painting } from '@/types/painting';

import type { ScanSearchCandidate } from './visionService';
import { searchAllMuseums } from './unifiedMuseumService';

/**
 * Orchestration that turns Vision-derived search candidates into real museum
 * matches. It reuses `searchAllMuseums` verbatim, so every returned painting is
 * a normal, cached, schema-correct result — the scan feature adds no new
 * painting shape and no new persistence path.
 */

/** How many candidate queries we are willing to try per scan. */
const DEFAULT_MAX_CANDIDATES = 3;
/** Stop early once we have gathered at least this many unique matches. */
const DEFAULT_TARGET_MATCHES = 12;
/** Keep per-museum result counts small: scanning wants precision, not volume. */
const RESULTS_PER_MUSEUM = 10;

/** Signature-compatible subset of `searchAllMuseums`, for dependency injection. */
type SearchFn = typeof searchAllMuseums;

export interface RunScanSearchOptions {
  maxCandidates?: number;
  targetMatches?: number;
  /** Injectable for tests; defaults to the real `searchAllMuseums`. */
  searchFn?: SearchFn;
}

function paintingKey(painting: Painting): string {
  return `${painting.title.trim().toLowerCase()}|${painting.artist
    .trim()
    .toLowerCase()}`;
}

/**
 * Merge `incoming` paintings into `existing`, preserving order and dropping
 * duplicates. Matches the dedup semantics used across the app: same `id`, OR
 * same (title + artist) case-insensitively.
 */
export function mergeUniquePaintings(
  existing: Painting[],
  incoming: Painting[],
): Painting[] {
  const ids = new Set(existing.map((p) => p.id));
  const composites = new Set(existing.map((p) => paintingKey(p)));
  const merged = [...existing];

  for (const painting of incoming) {
    const composite = paintingKey(painting);
    if (ids.has(painting.id) || composites.has(composite)) continue;
    ids.add(painting.id);
    composites.add(composite);
    merged.push(painting);
  }

  return merged;
}

/**
 * Run the highest-confidence candidates through the museum search pipeline,
 * accumulating unique matches until the target is reached or candidates run
 * out. Returns matches ordered by candidate confidence, then search relevance
 * (search relevance is already applied inside `searchAllMuseums`).
 */
export async function runScanSearch(
  candidates: ScanSearchCandidate[],
  museumIds: string[],
  options: RunScanSearchOptions = {},
): Promise<Painting[]> {
  const searchFn = options.searchFn ?? searchAllMuseums;
  const maxCandidates = options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
  const targetMatches = options.targetMatches ?? DEFAULT_TARGET_MATCHES;

  if (candidates.length === 0 || museumIds.length === 0) {
    return [];
  }

  let matches: Painting[] = [];

  for (const candidate of candidates.slice(0, maxCandidates)) {
    try {
      const result = await searchFn({
        maxResultsPerMuseum: RESULTS_PER_MUSEUM,
        museumIds,
        query: candidate.query,
        searchType: candidate.searchType,
        useCache: true,
      });
      matches = mergeUniquePaintings(matches, result.paintings);
    } catch (error) {
      // A single failing candidate must not abort the whole scan.
      console.warn(
        `[Scan] candidate "${candidate.query}" (${candidate.searchType}) failed:`,
        error,
      );
    }

    if (matches.length >= targetMatches) break;
  }

  return matches;
}
