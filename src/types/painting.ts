export type Painting = {
  artist: string;
  color: string;
  description?: string;
  dimensions?: string;
  id: number;
  imageUrl?: string;          // Full size image for detail view
  location?: string;
  medium?: string;
  museum?: string;
  thumbnailUrl?: string;      // Small thumbnail for lists/grids
  title: string;
  year?: number;

  // User interaction metadata
  dateAdded?: string;         // ISO date string when added to collection
  isSeen?: boolean;
  notes?: string;             // Personal notes about the painting
  seenDate?: string;          // ISO date string of when they saw it
  seenLocation?: string;      // Where they saw it (if different from museum)
  wantToVisit?: boolean;      // On their wish list

  // Legacy field (keeping for compatibility)
  isInPalette?: boolean;      // Deprecated - use palettePaintingIds instead
};

export type UserProfile = {
  profileColor: string;
  stats: {
    followers: string;
    following: number;
    paintings: number;
  };
  username: string;
};