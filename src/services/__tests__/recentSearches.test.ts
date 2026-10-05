const mockStore: Record<string, string> = {};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    delete: (key: string) => {
      delete mockStore[key];
    },
    getString: (key: string) => mockStore[key] ?? undefined,
    set: (key: string, value: string) => {
      mockStore[key] = value;
    },
  })),
}));

import {
  clearRecentSearches,
  getRecentSearches,
  MAX_RECENT_SEARCHES,
  rememberSearch,
} from '@/services/recentSearches';

beforeEach(() => {
  for (const key of Object.keys(mockStore)) delete mockStore[key];
});

describe('recentSearches', () => {
  it('starts empty and remembers most recent first', () => {
    expect(getRecentSearches()).toEqual([]);
    rememberSearch('Rembrandt');
    rememberSearch('Night Watch');
    expect(getRecentSearches()).toEqual(['Night Watch', 'Rembrandt']);
  });

  it('moves a repeated query to the front, ignoring case and whitespace', () => {
    rememberSearch('Rembrandt');
    rememberSearch('Vermeer');
    const list = rememberSearch('  rembrandt ');
    expect(list).toEqual(['rembrandt', 'Vermeer']);
  });

  it('ignores blank queries and caps the list', () => {
    rememberSearch('   ');
    expect(getRecentSearches()).toEqual([]);
    for (let index = 0; index < MAX_RECENT_SEARCHES + 3; index++)
      rememberSearch(`q${index}`);
    const list = getRecentSearches();
    expect(list).toHaveLength(MAX_RECENT_SEARCHES);
    expect(list[0]).toBe(`q${MAX_RECENT_SEARCHES + 2}`);
  });

  it('survives corrupt storage and clears', () => {
    mockStore.queries = '{not json';
    expect(getRecentSearches()).toEqual([]);
    rememberSearch('Monet');
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });
});
