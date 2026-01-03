/**
 * Art Deco Color Palette
 * Inspired by 1920s-1930s design: gold, black, cream, geometric patterns
 */

export const COLORS = {
  // Primary Art Deco palette
  gold: '#d4af37',
  goldDark: '#b8941f',
  goldLight: '#f4d03f',
  
  black: '#1a1a1a',
  charcoal: '#2d2d2d',
  cream: '#f5f5dc',
  ivory: '#fffff0',
  
  // Accent colors
  burgundy: '#800020',
  emerald: '#50c878',
  sapphire: '#0f52ba',
  
  // Neutral grays
  gray100: '#f8f8f8',
  gray200: '#e0e0e0',
  gray300: '#c0c0c0',
  gray400: '#a0a0a0',
  gray500: '#808080',
  gray600: '#606060',
  gray700: '#404040',
  gray800: '#2d2d2d',
  gray900: '#1a1a1a',
  
  // Status colors
  success: '#50c878',
  warning: '#f4d03f',
  error: '#c13333',
  info: '#0f52ba',
  
  // Semantic colors
  seen: '#50c878',      // Emerald green
  wantToVisit: '#f4d03f', // Gold
  inPalette: '#d4af37',   // Primary gold
  
  // Background
  background: '#ffffff',
  backgroundDark: '#1a1a1a',
  surface: '#f8f8f8',
  surfaceDark: '#2d2d2d',
  
  // Text
  text: '#1a1a1a',
  textLight: '#606060',
  textInverse: '#ffffff',
  
  // Borders
  border: '#e0e0e0',
  borderDark: '#404040',
} as const;

/**
 * Museum brand colors
 * Used for museum badges and identification
 */
export const MUSEUM_COLORS = {
  // Tier 1 museums
  met: '#e4002b',           // Met red
  rijksmuseum: '#1e3a8a',   // Dutch blue
  chicago: '#c8102e',       // Chicago red
  nationalGallery: '#0f4c81', // British blue
  cleveland: '#00205b',     // Cleveland blue
  
  // Tier 2 museums
  harvardArt: '#a51c30',    // Harvard crimson
  va: '#8b0000',            // V&A burgundy
  
  // Tier 3 museums
  europeana: '#0a72cc',     // EU blue
  parisMuseums: '#002654',  // Paris blue
  joconde: '#002654',       // French blue
  wikidata: '#006699',      // Wikidata blue
  
  // Default
  default: '#808080',
} as const;

/**
 * Opacity values for layering
 */
export const OPACITY = {
  disabled: 0.4,
  overlay: 0.8,
  subtle: 0.6,
  medium: 0.7,
  strong: 0.9,
} as const;
