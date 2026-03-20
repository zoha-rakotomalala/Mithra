import type { Painting } from '@/types/painting';

export interface MuseumSearchParams {
  query: string;
  maxResults: number;
  searchType: 'artist' | 'title';
}

export interface MuseumSearchResult {
  paintings: Painting[];
  totalResults: number;
}

export interface MuseumServiceAdapter {
  readonly museumId: string;
  search(params: MuseumSearchParams): Promise<MuseumSearchResult>;
}
