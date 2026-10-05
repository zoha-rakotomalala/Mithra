import type { Painting } from '@/types/painting';
import type { ScanSearchCandidate } from '@/services/visionService';
import {
  mergeUniquePaintings,
  runScanSearch,
} from '@/services/scanMatchService';

// scanMatchService imports searchAllMuseums from unifiedMuseumService at module
// scope. Mock it to avoid pulling the whole museum-adapter graph into the test;
// runScanSearch is exercised via an injected searchFn anyway.
jest.mock('@/services/unifiedMuseumService', () => ({
  searchAllMuseums: jest.fn(),
}));

function painting(overrides: Partial<Painting> = {}): Painting {
  return {
    artist: 'Vincent van Gogh',
    color: '#3A7BD5',
    id: 'met-1',
    title: 'The Starry Night',
    ...overrides,
  };
}

function candidate(
  overrides: Partial<ScanSearchCandidate> = {},
): ScanSearchCandidate {
  return {
    confidence: 0.9,
    query: 'The Starry Night',
    searchType: 'title',
    source: 'bestGuess',
    ...overrides,
  };
}

describe('scanMatchService.mergeUniquePaintings', () => {
  it('appends unique paintings preserving order', () => {
    const a = painting({ id: 'a', title: 'A' });
    const b = painting({ id: 'b', title: 'B' });
    expect(mergeUniquePaintings([a], [b]).map((p) => p.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('dedupes by id', () => {
    const a = painting({ id: 'a', title: 'A' });
    const dupe = painting({ id: 'a', title: 'Different title' });
    expect(mergeUniquePaintings([a], [dupe])).toHaveLength(1);
  });

  it('dedupes by title+artist case-insensitively even with different ids', () => {
    const a = painting({ artist: 'Van Gogh', id: 'x', title: 'Starry Night' });
    const b = painting({ artist: 'van gogh', id: 'y', title: 'starry night' });
    expect(mergeUniquePaintings([a], [b])).toHaveLength(1);
  });
});

describe('scanMatchService.runScanSearch', () => {
  it('returns [] with no candidates or no museums', async () => {
    const searchFn = jest.fn();
    expect(await runScanSearch([], ['MET'], { searchFn })).toEqual([]);
    expect(await runScanSearch([candidate()], [], { searchFn })).toEqual([]);
    expect(searchFn).not.toHaveBeenCalled();
  });

  it('merges results across candidates and dedupes', async () => {
    const searchFn = jest
      .fn()
      .mockResolvedValueOnce({ paintings: [painting({ id: 'a', title: 'A' })] })
      .mockResolvedValueOnce({
        paintings: [
          painting({ id: 'a', title: 'A' }), // dupe
          painting({ id: 'b', title: 'B' }),
        ],
      });

    const result = await runScanSearch(
      [candidate({ query: 'q1' }), candidate({ query: 'q2' })],
      ['MET'],
      { searchFn },
    );

    expect(result.map((p) => p.id)).toEqual(['a', 'b']);
    expect(searchFn).toHaveBeenCalledTimes(2);
  });

  it('respects the maxCandidates cap', async () => {
    const searchFn = jest.fn().mockResolvedValue({ paintings: [] });
    await runScanSearch(
      [
        candidate({ query: 'q1' }),
        candidate({ query: 'q2' }),
        candidate({ query: 'q3' }),
        candidate({ query: 'q4' }),
      ],
      ['MET'],
      { maxCandidates: 2, searchFn },
    );
    expect(searchFn).toHaveBeenCalledTimes(2);
  });

  it('stops early once the target match count is reached', async () => {
    const searchFn = jest.fn().mockResolvedValue({
      paintings: [painting({ id: 'a' }), painting({ id: 'b', title: 'B' })],
    });
    await runScanSearch(
      [candidate({ query: 'q1' }), candidate({ query: 'q2' })],
      ['MET'],
      { searchFn, targetMatches: 2 },
    );
    expect(searchFn).toHaveBeenCalledTimes(1);
  });

  it('does not abort when a single candidate search throws', async () => {
    const searchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ paintings: [painting({ id: 'ok' })] });

    const result = await runScanSearch(
      [candidate({ query: 'bad' }), candidate({ query: 'good' })],
      ['MET'],
      { searchFn },
    );
    expect(result.map((p) => p.id)).toEqual(['ok']);
  });
});
