/**
 * Central registry for all supported museums
 */

export type MuseumConfig = {
  color: string;
  country: string;
  description: string;
  enabled: boolean;
  id: string;
  name: string;
  requiresApiKey: boolean;
  shortName: string;
  tier: 1 | 2 | 3; // 1 = Default, 2 = Optional, 3 = Advanced
}

export const MUSEUMS: Record<string, MuseumConfig> = {
  CHICAGO: {
    color: '#A8DADC',
    country: 'USA',
    description: '300,000+ artworks, strong Impressionist collection',
    enabled: true,
    id: 'CHICAGO',
    name: 'Art Institute of Chicago',
    requiresApiKey: false,
    shortName: 'AIC',
    tier: 1,
  },
  CLEVELAND: {
    color: '#457B9D',
    country: 'USA',
    description: '61,000+ artworks spanning 6,000 years',
    enabled: true,
    id: 'CLEVELAND',
    name: 'Cleveland Museum of Art',
    requiresApiKey: false,
    shortName: 'CMA',
    tier: 1,
  },
  EUROPEANA: {
    color: '#1E3A8A',
    country: 'Europe',
    description: '50M+ artworks from 3,700+ European institutions',
    enabled: true,
    id: 'EUROPEANA',
    name: 'Europeana',
    requiresApiKey: false,
    shortName: 'Europeana',
    tier: 3,
  },
  HARVARD: {
    color: '#A4161A',
    country: 'USA',
    description: '250,000+ objects across three museums',
    enabled: true,
    id: 'HARVARD',
    name: 'Harvard Art Museums',
    requiresApiKey: false,
    shortName: 'Harvard',
    tier: 2,
  },
  MET: {
    color: '#d4af37',
    country: 'USA',
    description: '470,000+ artworks from ancient to contemporary',
    enabled: true,
    id: 'MET',
    name: 'Metropolitan Museum of Art',
    requiresApiKey: false,
    shortName: 'MET',
    tier: 1,
  },
  NG: {
    color: '#2D6A4F',
    country: 'UK',
    description: 'Western European paintings from 1250-1900',
    enabled: true,
    id: 'NG',
    name: 'National Gallery',
    requiresApiKey: false,
    shortName: 'NG',
    tier: 2,
  },
  PARIS: {
    color: '#DB2777',
    country: 'France',
    description: '14 Paris museums with 250,000+ artworks',
    enabled: true,
    id: 'PARIS',
    name: 'Paris Musées',
    requiresApiKey: false,
    shortName: 'Paris',
    tier: 3,
  },
  RIJKS: {
    color: '#E63946',
    country: 'Netherlands',
    description: 'Dutch masters and 700,000+ artworks',
    enabled: true,
    id: 'RIJKS',
    name: 'Rijksmuseum',
    requiresApiKey: false,
    shortName: 'Rijks',
    tier: 1,
  },
  VA: {
    color: '#6A4C93',
    country: 'UK',
    description: 'World-leading museum of art, design and performance',
    enabled: true,
    id: 'VA',
    name: 'Victoria and Albert Museum',
    requiresApiKey: false,
    shortName: 'V&A',
    tier: 2,
  },
};

export function getAllMuseums(): MuseumConfig[] {
  return Object.values(MUSEUMS).filter(m => m.enabled);
}

export function getMuseumById(id: string): MuseumConfig | undefined {
  return MUSEUMS[id];
}

export function getMuseumsByIds(ids: string[]): MuseumConfig[] {
  return ids
    .map(id => MUSEUMS[id])
    .filter(Boolean);
}

export function getMuseumsByTier(tier: 1 | 2 | 3): MuseumConfig[] {
  return Object.values(MUSEUMS)
    .filter(m => m.enabled && m.tier === tier);
}

// Quick access to commonly used museum groups
export const TIER_1_MUSEUMS = ['MET', 'RIJKS', 'CHICAGO', 'CLEVELAND']; // Best 4
export const TIER_2_MUSEUMS = ['HARVARD', 'VA', 'NG']; // Optional
export const TIER_3_MUSEUMS = ['EUROPEANA', 'PARIS']; // Advanced