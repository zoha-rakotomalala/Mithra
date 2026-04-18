import type { UserCollectionEntry, UserPalette } from '@/types/database';

// Mock MMKV since syncService imports it at module level
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock supabase since syncService imports it at module level
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      upsert: jest.fn(),
      delete: jest.fn(),
      select: jest.fn(),
    }),
  },
}));

import { mergeCollectionData, mergePaletteData } from '../syncService';

function makeEntry(
  overrides: Partial<UserCollectionEntry> = {},
): UserCollectionEntry {
  return {
    id: overrides.id ?? 'entry-1',
    user_id: overrides.user_id ?? 'user-1',
    painting_id: overrides.painting_id ?? 'painting-1',
    is_seen: overrides.is_seen ?? false,
    want_to_visit: overrides.want_to_visit ?? false,
    seen_date: overrides.seen_date ?? null,
    date_added: overrides.date_added ?? '2025-01-01T00:00:00Z',
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? '2025-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2025-01-01T00:00:00Z',
  };
}

function makePalette(overrides: Partial<UserPalette> = {}): UserPalette {
  return {
    id: overrides.id ?? 'palette-1',
    user_id: overrides.user_id ?? 'user-1',
    painting_ids: overrides.painting_ids ?? ['p1', 'p2'],
    created_at: overrides.created_at ?? '2025-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2025-01-01T00:00:00Z',
  };
}

describe('mergeCollectionData', () => {
  it('returns empty array when both local and remote are empty', () => {
    expect(mergeCollectionData([], [])).toEqual([]);
  });

  it('returns remote entries when local is empty', () => {
    const remote = [
      makeEntry({ painting_id: 'p1' }),
      makeEntry({ painting_id: 'p2' }),
    ];
    const result = mergeCollectionData([], remote);
    expect(result).toEqual(remote);
  });

  it('returns local entries when remote is empty', () => {
    const local = [
      makeEntry({ painting_id: 'p1' }),
      makeEntry({ painting_id: 'p2' }),
    ];
    const result = mergeCollectionData(local, []);
    expect(result).toEqual(local);
  });

  it('keeps the entry with the more recent updated_at when present in both', () => {
    const local = [
      makeEntry({
        painting_id: 'p1',
        updated_at: '2025-06-01T00:00:00Z',
        notes: 'local',
      }),
    ];
    const remote = [
      makeEntry({
        painting_id: 'p1',
        updated_at: '2025-05-01T00:00:00Z',
        notes: 'remote',
      }),
    ];

    const result = mergeCollectionData(local, remote);
    expect(result).toHaveLength(1);
    expect(result[0].notes).toBe('local');
  });

  it('remote wins when timestamps are equal (tie-breaking)', () => {
    const local = [
      makeEntry({
        painting_id: 'p1',
        updated_at: '2025-06-01T00:00:00Z',
        notes: 'local',
      }),
    ];
    const remote = [
      makeEntry({
        painting_id: 'p1',
        updated_at: '2025-06-01T00:00:00Z',
        notes: 'remote',
      }),
    ];

    const result = mergeCollectionData(local, remote);
    expect(result).toHaveLength(1);
    expect(result[0].notes).toBe('remote');
  });

  it('includes disjoint entries from both local and remote', () => {
    const local = [makeEntry({ painting_id: 'p1', notes: 'local-only' })];
    const remote = [makeEntry({ painting_id: 'p2', notes: 'remote-only' })];

    const result = mergeCollectionData(local, remote);
    expect(result).toHaveLength(2);

    const ids = result.map((e) => e.painting_id).sort();
    expect(ids).toEqual(['p1', 'p2']);
  });

  it('handles a mix of conflicts, local-only, and remote-only entries', () => {
    const local = [
      makeEntry({
        painting_id: 'shared',
        updated_at: '2025-06-01T00:00:00Z',
        notes: 'local-newer',
      }),
      makeEntry({ painting_id: 'local-only', notes: 'only-local' }),
    ];
    const remote = [
      makeEntry({
        painting_id: 'shared',
        updated_at: '2025-05-01T00:00:00Z',
        notes: 'remote-older',
      }),
      makeEntry({ painting_id: 'remote-only', notes: 'only-remote' }),
    ];

    const result = mergeCollectionData(local, remote);
    expect(result).toHaveLength(3);

    const byId = new Map(result.map((e) => [e.painting_id, e]));
    expect(byId.get('shared')!.notes).toBe('local-newer');
    expect(byId.get('local-only')!.notes).toBe('only-local');
    expect(byId.get('remote-only')!.notes).toBe('only-remote');
  });

  it('does not produce duplicate entries for the same painting_id', () => {
    const local = [makeEntry({ painting_id: 'p1' })];
    const remote = [makeEntry({ painting_id: 'p1' })];

    const result = mergeCollectionData(local, remote);
    expect(result).toHaveLength(1);
  });
});

describe('mergePaletteData', () => {
  it('returns null when both local and remote are null', () => {
    expect(mergePaletteData(null, null)).toBeNull();
  });

  it('returns remote when local is null', () => {
    const remote = makePalette({ painting_ids: ['p1'] });
    expect(mergePaletteData(null, remote)).toEqual(remote);
  });

  it('returns local when remote is null', () => {
    const local = makePalette({ painting_ids: ['p1'] });
    expect(mergePaletteData(local, null)).toEqual(local);
  });

  it('keeps the palette with the more recent updated_at', () => {
    const local = makePalette({
      updated_at: '2025-06-01T00:00:00Z',
      painting_ids: ['local'],
    });
    const remote = makePalette({
      updated_at: '2025-05-01T00:00:00Z',
      painting_ids: ['remote'],
    });

    const result = mergePaletteData(local, remote);
    expect(result!.painting_ids).toEqual(['local']);
  });

  it('remote wins when timestamps are equal (tie-breaking)', () => {
    const local = makePalette({
      updated_at: '2025-06-01T00:00:00Z',
      painting_ids: ['local'],
    });
    const remote = makePalette({
      updated_at: '2025-06-01T00:00:00Z',
      painting_ids: ['remote'],
    });

    const result = mergePaletteData(local, remote);
    expect(result!.painting_ids).toEqual(['remote']);
  });

  it('keeps local palette when local is strictly newer', () => {
    const local = makePalette({
      updated_at: '2025-07-01T00:00:00Z',
      painting_ids: ['a', 'b'],
    });
    const remote = makePalette({
      updated_at: '2025-06-01T00:00:00Z',
      painting_ids: ['c'],
    });

    const result = mergePaletteData(local, remote);
    expect(result!.painting_ids).toEqual(['a', 'b']);
  });
});
