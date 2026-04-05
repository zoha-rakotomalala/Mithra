import { MUSEUM_COLORS } from './colors';

/**
 * Museum metadata for badges and identification
 */

export interface MuseumBadgeInfo {
  id: string;
  shortName: string;
  color: string;
  tier: 1 | 2 | 3;
}

export const MUSEUM_BADGES: Record<string, MuseumBadgeInfo> = {
  MET: {
    id: 'MET',
    shortName: 'MET',
    color: MUSEUM_COLORS.met,
    tier: 1,
  },
  RIJKS: {
    id: 'RIJKS',
    shortName: 'Rijks',
    color: MUSEUM_COLORS.rijksmuseum,
    tier: 1,
  },
  CLEVELAND: {
    id: 'CLEVELAND',
    shortName: 'CMA',
    color: MUSEUM_COLORS.cleveland,
    tier: 1,
  },
  CHICAGO: {
    id: 'CHICAGO',
    shortName: 'AIC',
    color: MUSEUM_COLORS.chicago,
    tier: 1,
  },
  NG: {
    id: 'NG',
    shortName: 'NG',
    color: MUSEUM_COLORS.nationalGallery,
    tier: 2,
  },
  HARVARD: {
    id: 'HARVARD',
    shortName: 'Harvard',
    color: MUSEUM_COLORS.harvardArt,
    tier: 2,
  },
  VA: {
    id: 'VA',
    shortName: 'V&A',
    color: MUSEUM_COLORS.va,
    tier: 2,
  },
  EUROPEANA: {
    id: 'EUROPEANA',
    shortName: 'Euro',
    color: MUSEUM_COLORS.europeana,
    tier: 3,
  },
  PARIS: {
    id: 'PARIS',
    shortName: 'Paris',
    color: MUSEUM_COLORS.parisMuseums,
    tier: 3,
  },
  JOCONDE: {
    id: 'JOCONDE',
    shortName: 'Joconde',
    color: MUSEUM_COLORS.joconde,
    tier: 3,
  },
  WIKIDATA: {
    id: 'WIKIDATA',
    shortName: 'Wiki',
    color: MUSEUM_COLORS.wikidata,
    tier: 3,
  },
  SMK: {
    id: 'SMK',
    shortName: 'SMK',
    color: MUSEUM_COLORS.smk,
    tier: 2,
  },
  LOUVRE: {
    id: 'LOUVRE',
    shortName: 'Louvre',
    color: MUSEUM_COLORS.louvre,
    tier: 2,
  },
  SMITHSONIAN: {
    id: 'SMITHSONIAN',
    shortName: 'Smith.',
    color: MUSEUM_COLORS.smithsonian,
    tier: 2,
  },
};

/**
 * Get museum badge info by museum ID or source
 */
export function getMuseumBadge(museumId: string): MuseumBadgeInfo {
  return MUSEUM_BADGES[museumId] || {
    id: 'UNKNOWN',
    shortName: '?',
    color: MUSEUM_COLORS.default,
    tier: 3,
  };
}
