import { MUSEUM_COLORS } from './colors';

/**
 * Museum metadata for badges and identification
 */

export interface MuseumBadgeInfo {
  id: string;
  shortName: string;
  color: string;
}

export const MUSEUM_BADGES: Record<string, MuseumBadgeInfo> = {
  MET: {
    id: 'MET',
    shortName: 'MET',
    color: MUSEUM_COLORS.met,
  },
  RIJKS: {
    id: 'RIJKS',
    shortName: 'Rijks',
    color: MUSEUM_COLORS.rijksmuseum,
  },
  CLEVELAND: {
    id: 'CLEVELAND',
    shortName: 'CMA',
    color: MUSEUM_COLORS.cleveland,
  },
  CHICAGO: {
    id: 'CHICAGO',
    shortName: 'AIC',
    color: MUSEUM_COLORS.chicago,
  },
  NG: {
    id: 'NG',
    shortName: 'NG',
    color: MUSEUM_COLORS.nationalGallery,
  },
  HARVARD: {
    id: 'HARVARD',
    shortName: 'Harvard',
    color: MUSEUM_COLORS.harvardArt,
  },
  VA: {
    id: 'VA',
    shortName: 'V&A',
    color: MUSEUM_COLORS.va,
  },
  EUROPEANA: {
    id: 'EUROPEANA',
    shortName: 'Euro',
    color: MUSEUM_COLORS.europeana,
  },
  PARIS: {
    id: 'PARIS',
    shortName: 'Paris',
    color: MUSEUM_COLORS.parisMuseums,
  },
  JOCONDE: {
    id: 'JOCONDE',
    shortName: 'Joconde',
    color: MUSEUM_COLORS.joconde,
  },
  WIKIDATA: {
    id: 'WIKIDATA',
    shortName: 'Wiki',
    color: MUSEUM_COLORS.wikidata,
  },
  SMK: {
    id: 'SMK',
    shortName: 'SMK',
    color: MUSEUM_COLORS.smk,
  },
  LOUVRE: {
    id: 'LOUVRE',
    shortName: 'Louvre',
    color: MUSEUM_COLORS.louvre,
  },
  ORSAY: {
    id: 'ORSAY',
    shortName: 'Orsay',
    color: MUSEUM_COLORS.orsay,
  },
  SMITHSONIAN: {
    id: 'SMITHSONIAN',
    shortName: 'Smith.',
    color: MUSEUM_COLORS.smithsonian,
  },
};

/**
 * Get museum badge info by museum ID or source
 */
export function getMuseumBadge(museumId: string): MuseumBadgeInfo {
  return (
    MUSEUM_BADGES[museumId] || {
      id: 'UNKNOWN',
      shortName: '?',
      color: MUSEUM_COLORS.default,
    }
  );
}
