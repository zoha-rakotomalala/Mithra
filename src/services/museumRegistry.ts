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
};

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
  },
  JOCONDE: {
    id: 'JOCONDE',
    name: 'Joconde (French Museums)',
    shortName: 'Joconde',
    color: '#2563EB',
    country: 'France',
    description: '600,000+ artworks from 350+ French museums',
    enabled: true,
    requiresApiKey: false,
  },
  LOUVRE: {
    id: 'LOUVRE',
    name: 'Musée du Louvre',
    shortName: 'Louvre',
    color: '#7C3AED',
    country: 'France',
    description: '500,000+ works including the Mona Lisa',
    enabled: true,
    requiresApiKey: false,
  },
  ORSAY: {
    color: '#B45309',
    country: 'France',
    description:
      'Impressionism and 1848-1914 art; 4,900 paintings via Wikidata',
    enabled: true,
    id: 'ORSAY',
    name: "Musée d'Orsay",
    requiresApiKey: false,
    shortName: 'Orsay',
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
  },
  SMK: {
    id: 'SMK',
    name: 'SMK — National Gallery of Denmark',
    shortName: 'SMK',
    color: '#059669',
    country: 'Denmark',
    description: '240,000+ works of Danish and international art',
    enabled: true,
    requiresApiKey: false,
  },
  SMITHSONIAN: {
    id: 'SMITHSONIAN',
    name: 'Smithsonian Institution',
    shortName: 'Smithsonian',
    color: '#DC2626',
    country: 'USA',
    description: '5.1M+ items across 19 museums',
    enabled: true,
    requiresApiKey: true,
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
  },
  WIKIDATA: {
    id: 'WIKIDATA',
    name: 'Every museum (Wikidata)',
    shortName: 'Wikidata',
    color: '#339966',
    country: 'Global',
    description: '1,000,000+ paintings from every museum Wikidata knows',
    enabled: true,
    requiresApiKey: false,
  },
};

/**
 * The scope a search starts with. Wikidata covers every museum, including
 * the ones without an API; the museum adapters are enrichment, not the
 * catalog, so none of them needs to be on by default.
 */
export const DEFAULT_MUSEUMS = ['WIKIDATA'];

/** Every enabled museum: Wikidata first, the rest alphabetical by name. */
export function getAllMuseums(): MuseumConfig[] {
  return Object.values(MUSEUMS)
    .filter((m) => m.enabled)
    .sort((a, b) => {
      if (a.id === 'WIKIDATA') return -1;
      if (b.id === 'WIKIDATA') return 1;
      return a.name.localeCompare(b.name);
    });
}

export function getMuseumById(id: string): MuseumConfig | undefined {
  return MUSEUMS[id];
}

export function getMuseumsByIds(ids: string[]): MuseumConfig[] {
  return ids.map((id) => MUSEUMS[id]).filter(Boolean);
}
