jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../museumCache', () => ({
  resolveMuseumId: jest.fn(),
}));

import {
  getCachedPainting,
  cachePainting,
  getCachedPaintings,
} from '../paintings.service';
import { supabase } from '../supabase';
import { resolveMuseumId } from '../museumCache';

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper to build a supabase chain mock
function mockChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: any = {};
  const methods = ['select', 'eq', 'in', 'single', 'upsert'];
  methods.forEach((m) => {
    chain[m] = overrides[m] || jest.fn().mockReturnValue(chain);
  });
  (supabase.from as jest.Mock).mockReturnValue(chain);
  return chain;
}

describe('getCachedPainting', () => {
  it('returns painting when found by UUID', async () => {
    const mockPainting = {
      id: 'uuid-1',
      title: 'Starry Night',
      artist: 'Van Gogh',
    };
    const single = jest
      .fn()
      .mockResolvedValue({ data: mockPainting, error: null });
    mockChain({ single });

    const result = await getCachedPainting('uuid-1');
    expect(result).toEqual(mockPainting);
    expect(supabase.from).toHaveBeenCalledWith('paintings');
  });

  it('falls back to legacy_id when UUID not found', async () => {
    const mockPainting = { id: 'uuid-2', title: 'Legacy Find' };
    // First call: not found by UUID; second call: found by legacy_id
    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation(() => {
      callCount++;
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.single = jest
        .fn()
        .mockResolvedValue(
          callCount === 1
            ? { data: null, error: { code: 'PGRST116' } }
            : { data: mockPainting, error: null },
        );
      return chain;
    });

    const result = await getCachedPainting('old-id');
    expect(result).toEqual(mockPainting);
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it('returns null when painting not found by UUID or legacy_id', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.single = jest
        .fn()
        .mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      return chain;
    });

    const result = await getCachedPainting('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null and logs on unexpected error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const single = jest
      .fn()
      .mockResolvedValue({
        data: null,
        error: { code: 'UNEXPECTED', message: 'db down' },
      });
    mockChain({ single });

    const result = await getCachedPainting('uuid-1');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe('cachePainting', () => {
  it('returns null when museum cannot be resolved', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (resolveMuseumId as jest.Mock).mockResolvedValue(null);

    const result = await cachePainting({
      museumLegacyId: 'UNKNOWN',
      externalId: '123',
      title: 'Test',
      artist: 'Test Artist',
    });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('upserts painting with correct conflict key', async () => {
    const mockResult = { id: 'uuid-1', title: 'Test', artist: 'Artist' };
    (resolveMuseumId as jest.Mock).mockResolvedValue('museum-uuid');

    const upsert = jest.fn();
    const single = jest
      .fn()
      .mockResolvedValue({ data: mockResult, error: null });
    const select = jest.fn().mockReturnValue({ single });
    upsert.mockReturnValue({ select });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    const result = await cachePainting({
      museumLegacyId: 'MET',
      externalId: '12345',
      title: 'Test Painting',
      artist: 'Test Artist',
      year: '1889',
    });

    expect(result).toEqual(mockResult);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        museum_id: 'museum-uuid',
        external_id: '12345',
        title: 'Test Painting',
      }),
      { onConflict: 'museum_id,external_id' },
    );
  });

  it('returns null and logs on upsert error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (resolveMuseumId as jest.Mock).mockResolvedValue('museum-uuid');

    const single = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'conflict' } });
    const select = jest.fn().mockReturnValue({ single });
    const upsert = jest.fn().mockReturnValue({ select });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    const result = await cachePainting({
      museumLegacyId: 'MET',
      externalId: '123',
      title: 'T',
      artist: 'A',
    });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('getCachedPaintings', () => {
  it('returns paintings for given UUIDs', async () => {
    const mockPaintings = [
      { id: 'uuid-1', title: 'A' },
      { id: 'uuid-2', title: 'B' },
    ];
    const inMock = jest
      .fn()
      .mockResolvedValue({ data: mockPaintings, error: null });
    const select = jest.fn().mockReturnValue({ in: inMock });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getCachedPaintings(['uuid-1', 'uuid-2']);
    expect(result).toEqual(mockPaintings);
  });

  it('returns empty array on error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const inMock = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'fail' } });
    const select = jest.fn().mockReturnValue({ in: inMock });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getCachedPaintings(['uuid-1']);
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('returns empty array when data is null without error', async () => {
    const inMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const select = jest.fn().mockReturnValue({ in: inMock });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getCachedPaintings(['uuid-1']);
    expect(result).toEqual([]);
  });
});
