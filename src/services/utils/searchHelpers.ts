import type { Painting } from '@/types/painting';

/**
 * Clean artist name by removing dates, nationalities, and extra info
 * "Vincent van Gogh (Dutch, 1853-1890)" → "Vincent van Gogh"
 * "Claude Monet\nFrench, 1840-1926" → "Claude Monet"
 */
export function cleanArtistName(artistDisplay: string): string {
  if (!artistDisplay) return 'Unknown Artist';

  return artistDisplay
    .split('\n')[0] // Take first line only
    .replace(/\([^)]*\)/g, '') // Remove (parentheses)
    .replace(/\[[^\]]*\]/g, '') // Remove [brackets]
    .replace(/\d{4}\s*[-–]\s*\d{4}/g, '') // Remove date ranges
    .replace(/,\s*\d{4}\s*[-–]\s*\d{4}/g, '') // Remove ", 1853-1890"
    .replace(/,\s*\d{4}/g, '') // Remove ", 1853"
    .replace(
      /\b(?:Dutch|French|American|Italian|Spanish|German|British|Belgian|Swiss|Austrian|Russian|Japanese|Chinese|Korean)\b/gi,
      '',
    ) // Remove nationalities
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Calculate relevance score for search results
 */
export function calculateRelevance(painting: Painting, query: string): number {
  let score = 0;
  const q = query.toLowerCase().trim();
  const title = painting.title.toLowerCase();
  const artist = cleanArtistName(painting.artist).toLowerCase();

  // Exact matches = highest priority
  if (title === q) score += 100;
  if (artist === q) score += 100;

  // Title contains query
  if (title.includes(q)) score += 50;

  // Artist name contains query
  if (artist.includes(q)) score += 75;

  // Split query into words for multi-word matches
  const queryWords = q.split(' ').filter((w) => w.length > 2);
  queryWords.forEach((word) => {
    if (title.includes(word)) score += 10;
    if (artist.includes(word)) score += 15;
  });

  // Has valid image = bonus
  if (painting.imageUrl && painting.imageUrl !== '') score += 20;

  // Known artist (not "Unknown")
  if (!artist.includes('unknown')) score += 10;

  // Has year = more complete data
  if (painting.year) score += 5;

  // Paintings (vs other object types) = slight bonus
  if (
    painting.medium?.toLowerCase().includes('paint') ||
    painting.medium?.toLowerCase().includes('oil') ||
    painting.medium?.toLowerCase().includes('canvas')
  ) {
    score += 5;
  }

  return score;
}

/**
 * Check if two paintings are duplicates
 */
export function isDuplicate(
  painting: Painting,
  existingPaintings: Painting[],
): boolean {
  const cleanTitle = painting.title.toLowerCase().trim();
  const cleanArtist = cleanArtistName(painting.artist).toLowerCase();

  return existingPaintings.some((existing) => {
    const existingTitle = existing.title.toLowerCase().trim();
    const existingArtist = cleanArtistName(existing.artist).toLowerCase();

    // Same title + same artist = duplicate
    const titleMatch = cleanTitle === existingTitle;
    const artistMatch = cleanArtist === existingArtist;

    // Also check for very similar titles (allows for minor variations)
    const similarTitle =
      cleanTitle.replace(/[^\w\s]/g, '') ===
      existingTitle.replace(/[^\w\s]/g, '');

    return (titleMatch && artistMatch) || (similarTitle && artistMatch);
  });
}

/**
 * Filter out non-painting items (for problematic sources like Europeana)
 */
export function isPaintingLike(painting: Painting): boolean {
  const title = painting.title.toLowerCase();
  const description = painting.description?.toLowerCase() || '';
  const medium = painting.medium?.toLowerCase() || '';

  // Exclude obvious non-paintings
  const excludeTerms = [
    'photograph',
    'photo',
    'exhibition',
    'catalogue',
    'book',
    'print',
    'poster',
    'drawing', // Unless explicitly a painting
    'sculpture',
    'textile',
    'furniture',
    'ceramic',
  ];

  // Check if it's explicitly excluded
  const isExcluded = excludeTerms.some(
    (term) => title.includes(term) || description.includes(term),
  );

  if (isExcluded) {
    // But allow if explicitly called a painting
    const isPainting =
      title.includes('painting') ||
      description.includes('painting') ||
      medium.includes('paint') ||
      medium.includes('oil') ||
      medium.includes('canvas');

    return isPainting;
  }

  return true;
}

/**
 * Normalize museum name for consistent display
 * For Europeana, extract actual museum from dataProvider
 */
export function getDisplayMuseumName(painting: Painting): string {
  // If it's from Europeana, try to show the actual museum
  if (typeof painting.id === 'string' && painting.id.startsWith('europeana-')) {
    // Europeana stores actual museum in painting.museum
    // Use that instead of "Europeana"
    return painting.museum || 'Europeana';
  }

  return painting.museum || 'Unknown Museum';
}

/**
 * Sort paintings by relevance score
 */
export function sortByRelevance(
  paintings: Painting[],
  query: string,
): Painting[] {
  return paintings
    .map((painting) => ({
      painting,
      score: calculateRelevance(painting, query),
    }))
    .filter((item) => item.score > 0) // Remove irrelevant results
    .sort((a, b) => b.score - a.score) // Highest score first
    .map((item) => item.painting);
}

/**
 * Remove duplicates from painting list
 */
export function removeDuplicates(paintings: Painting[]): Painting[] {
  const unique: Painting[] = [];

  for (const painting of paintings) {
    if (!isDuplicate(painting, unique)) {
      unique.push(painting);
    }
  }

  return unique;
}

/**
 * Filter paintings based on quality criteria
 */
export interface QualityFilter {
  requireImage?: boolean;
  requireArtist?: boolean;
  requireYear?: boolean;
  paintingsOnly?: boolean;
  minRelevanceScore?: number;
}

export function filterByQuality(
  paintings: Painting[],
  query: string,
  filters: QualityFilter = {},
): Painting[] {
  const {
    requireImage = true,
    requireArtist = true,
    requireYear = false,
    paintingsOnly = true,
    minRelevanceScore = 20,
  } = filters;

  return paintings.filter((painting) => {
    // Has image?
    if (requireImage && !painting.imageUrl) return false;

    // Has known artist?
    if (requireArtist) {
      const artist = cleanArtistName(painting.artist).toLowerCase();
      if (artist.includes('unknown') || artist.includes('onbekend')) {
        return false;
      }
    }

    // Has year?
    if (requireYear && !painting.year) return false;

    // Is painting-like?
    if (paintingsOnly && !isPaintingLike(painting)) return false;

    // Meets minimum relevance?
    if (minRelevanceScore > 0) {
      const score = calculateRelevance(painting, query);
      if (score < minRelevanceScore) return false;
    }

    return true;
  });
}
