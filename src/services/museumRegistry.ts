/**
 * Central registry for all supported museums
 */

export interface MuseumConfig {
  id: string;
  name: string;
  shortName: string;
  country: string;
  enabled: boolean;
  requiresApiKey: boolean;
  color: string;
  description: string;
  tier: 1 | 2 | 3; // 1 = Default, 2 = Optional, 3 = Advanced
}

export const MUSEUMS: Record<string, MuseumConfig> = {
  MET: {
    id: 'MET',
    name: 'Metropolitan Museum of Art',
    shortName: 'MET',
    country: 'USA',
    enabled: true,
    requiresApiKey: false,
    color: '#d4af37',
    description: '470,000+ artworks from ancient to contemporary',
    tier: 1,
  },
  RIJKS: {
    id: 'RIJKS',
    name: 'Rijksmuseum',
    shortName: 'Rijks',
    country: 'Netherlands',
    enabled: true,
    requiresApiKey: false,
    color: '#E63946',
    description: 'Dutch masters and 700,000+ artworks',
    tier: 1,
  },
  CLEVELAND: {
    id: 'CLEVELAND',
    name: 'Cleveland Museum of Art',
    shortName: 'CMA',
    country: 'USA',
    enabled: true,
    requiresApiKey: false,
    color: '#457B9D',
    description: '61,000+ artworks spanning 6,000 years',
    tier: 1,
  },
  CHICAGO: {
    id: 'CHICAGO',
    name: 'Art Institute of Chicago',
    shortName: 'AIC',
    country: 'USA',
    enabled: true,
    requiresApiKey: false,
    color: '#A8DADC',
    description: '300,000+ artworks, strong Impressionist collection',
    tier: 1,
  },
  HARVARD: {
    id: 'HARVARD',
    name: 'Harvard Art Museums',
    shortName: 'Harvard',
    country: 'USA',
    enabled: true,
    requiresApiKey: false,
    color: '#A4161A',
    description: '250,000+ objects across three museums',
    tier: 2,
  },
  VA: {
    id: 'VA',
    name: 'Victoria and Albert Museum',
    shortName: 'V&A',
    country: 'UK',
    enabled: true,
    requiresApiKey: false,
    color: '#6A4C93',
    description: 'World-leading museum of art, design and performance',
    tier: 2,
  },
  NG: {
    id: 'NG',
    name: 'National Gallery',
    shortName: 'NG',
    country: 'UK',
    enabled: true,
    requiresApiKey: false,
    color: '#2D6A4F',
    description: 'Western European paintings from 1250-1900',
    tier: 2,
  },
  EUROPEANA: {
    id: 'EUROPEANA',
    name: 'Europeana',
    shortName: 'Europeana',
    country: 'Europe',
    enabled: true,
    requiresApiKey: false,
    color: '#1E3A8A',
    description: '50M+ artworks from 3,700+ European institutions',
    tier: 3,
  },
  PARIS: {
    id: 'PARIS',
    name: 'Paris Musées',
    shortName: 'Paris',
    country: 'France',
    enabled: true,
    requiresApiKey: false,
    color: '#DB2777',
    description: '14 Paris museums with 250,000+ artworks',
    tier: 3,
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