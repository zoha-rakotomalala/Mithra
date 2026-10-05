import type { Painting } from '@/types/painting';

/**
 * What the query names. `any` is the Search screen's one field: adapters that
 * can only search one index (Rijksmuseum) run both and merge; the rest already
 * search full text and ignore it.
 */
export type SearchType = 'any' | 'artist' | 'title';

export interface MuseumSearchParams {
  query: string;
  maxResults: number;
  searchType: SearchType;
}

export interface MuseumSearchResult {
  paintings: Painting[];
  totalResults: number;
}

export interface MuseumServiceAdapter {
  readonly museumId: string;

  search(params: MuseumSearchParams): Promise<MuseumSearchResult>;
}
