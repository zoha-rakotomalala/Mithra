export type Painting = {
  id: number;
  title: string;
  artist: string;
  imageUrl?: string;
  color: string; // Placeholder color for now
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