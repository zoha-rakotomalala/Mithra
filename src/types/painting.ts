export type Painting = {
  id: number;
  title: string;
  artist: string;
  year?: number;
  medium?: string;
  dimensions?: string;
  museum?: string;
  location?: string;
  description?: string;
  imageUrl?: string;          // Full size image for detail view
  thumbnailUrl?: string;      // Small thumbnail for lists/grids
  color: string;

  // User interaction metadata
  isSeen?: boolean;
  seenDate?: string;          // ISO date string of when they saw it
  seenLocation?: string;      // Where they saw it (if different from museum)
  wantToVisit?: boolean;      // On their wish list
  notes?: string;             // Personal notes about the painting
  dateAdded?: string;         // ISO date string when added to collection

  // Legacy field (keeping for compatibility)
  isInPalette?: boolean;      // Deprecated - use palettePaintingIds instead
};

export type UserProfile = {
  username: string;
  profileColor: string;
  stats: {
    paintings: number;
    followers: string;
    following: number;
  };
};