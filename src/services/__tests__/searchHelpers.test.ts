import type { Painting } from '@/types/painting';
import {
  cleanArtistName,
  removeDuplicates,
  filterByQuality,
  sortByRelevance,
} from '../utils/searchHelpers';

function makePainting(overrides: Partial<Painting> = {}): Painting {
  return {
    id: overrides.id ?? 'p1',
    title: overrides.title ?? 'Test Painting',
    artist: overrides.artist ?? 'Test Artist',
    color: overrides.color ?? '#000',
    imageUrl: overrides.imageUrl ?? 'https://img.example.com/1.jpg',
    year: overrides.year ?? '1900',
    medium: overrides.medium,
    museum: overrides.museum,
    ...overrides,
  };
}

describe('cleanArtistName', () => {
  it('strips date ranges in parentheses', () => {
    expect(cleanArtistName('Claude Monet (1840-1926)')).toBe('Claude Monet');
  });

  it('strips nationality in parentheses', () => {
    expect(cleanArtistName('Vincent van Gogh (Dutch, 1853-1890)')).toBe('Vincent van Gogh');
  });

  it('strips nationality and date on newline', () => {
    expect(cleanArtistName('Claude Monet\nFrench, 1840-1926')).toBe('Claude Monet');
  });

  it('returns Unknown Artist for empty input', () => {
    expect(cleanArtistName('')).toBe('Unknown Artist');
  });

  it('returns clean name when already clean', () => {
    expect(cleanArtistName('Rembrandt')).toBe('Rembrandt');
  });

  it('strips bracketed content', () => {
    expect(cleanArtistName('Artist [attributed to]')).toBe('Artist');
  });
});

describe('removeDuplicates', () => {
  it('deduplicates by title+artist, keeps first occurrence', () => {
    const paintings = [
      makePainting({ id: 'p1', title: 'Starry Night', artist: 'Van Gogh' }),
      makePainting({ id: 'p2', title: 'Starry Night', artist: 'Van Gogh' }),
    ];
    const result = removeDuplicates(paintings);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('keeps paintings with different titles', () => {
    const paintings = [
      makePainting({ id: 'p1', title: 'A', artist: 'X' }),
      makePainting({ id: 'p2', title: 'B', artist: 'X' }),
    ];
    expect(removeDuplicates(paintings)).toHaveLength(2);
  });

  it('keeps paintings with same title but different artist', () => {
    const paintings = [
      makePainting({ id: 'p1', title: 'Landscape', artist: 'Artist A' }),
      makePainting({ id: 'p2', title: 'Landscape', artist: 'Artist B' }),
    ];
    expect(removeDuplicates(paintings)).toHaveLength(2);
  });
});

describe('filterByQuality', () => {
  it('filters out paintings without images when requireImage=true', () => {
    const paintings = [
      makePainting({ id: 'p1', imageUrl: 'https://img.example.com/1.jpg' }),
      makePainting({ id: 'p2', imageUrl: undefined }),
    ];
    const result = filterByQuality(paintings, 'Test Painting', {
      requireImage: true,
      requireArtist: false,
      paintingsOnly: false,
      minRelevanceScore: 0,
    });
    expect(result.every(p => !!p.imageUrl)).toBe(true);
  });

  it('filters out unknown artists when requireArtist=true', () => {
    const paintings = [
      makePainting({ id: 'p1', artist: 'Monet' }),
      makePainting({ id: 'p2', artist: 'Unknown' }),
    ];
    const result = filterByQuality(paintings, 'Test Painting', {
      requireImage: false,
      requireArtist: true,
      paintingsOnly: false,
      minRelevanceScore: 0,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('passes all through when no filters are strict', () => {
    const paintings = [
      makePainting({ id: 'p1', imageUrl: undefined, artist: 'Unknown' }),
    ];
    const result = filterByQuality(paintings, 'Test Painting', {
      requireImage: false,
      requireArtist: false,
      paintingsOnly: false,
      minRelevanceScore: 0,
    });
    expect(result).toHaveLength(1);
  });
});

describe('sortByRelevance', () => {
  it('exact title matches rank higher than partial matches', () => {
    const paintings = [
      makePainting({ id: 'partial', title: 'The Starry Night Over the Rhone' }),
      makePainting({ id: 'exact', title: 'Starry Night' }),
    ];
    const result = sortByRelevance(paintings, 'Starry Night');
    expect(result[0].id).toBe('exact');
  });

  it('exact artist matches rank higher than partial', () => {
    const paintings = [
      makePainting({ id: 'partial', title: 'Work', artist: 'Claude Monet School' }),
      makePainting({ id: 'exact', title: 'Work', artist: 'Monet' }),
    ];
    const result = sortByRelevance(paintings, 'Monet');
    expect(result[0].id).toBe('exact');
  });

  it('filters out zero-score results', () => {
    const paintings = [
      makePainting({ id: 'p1', title: 'Completely Unrelated', artist: 'Unknown', imageUrl: undefined, year: undefined }),
    ];
    const result = sortByRelevance(paintings, 'zzzzz');
    expect(result).toHaveLength(0);
  });
});
