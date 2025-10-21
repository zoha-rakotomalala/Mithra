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
  imageUrl?: string;
  color: string; // Placeholder color for now
  isSeen?: boolean;
  isInPalette?: boolean;
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