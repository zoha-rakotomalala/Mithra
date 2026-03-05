export interface Museum {
  id: string;
  name: string;
  short_name: string;
  location?: string;
  api_config: any;
  metadata: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  user_id: string;
  museum_id: string; // UUID FK to museums.id
  visit_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined field when fetching with museum data
  museum?: Pick<Museum, 'name' | 'short_name'>;
}

export interface Painting {
  id: string;          // UUID
  museum_id: string;   // UUID FK to museums.id
  external_id: string; // Original text ID portion (e.g. "12345" from "met-12345")
  legacy_id?: string;  // Original full text ID (e.g. "met-12345"), preserved from migration
  title: string;
  artist: string;
  year?: string;
  image_url?: string;
  thumbnail_url?: string;
  medium?: string;
  dimensions?: string;
  color?: string;
  metadata?: any;
  cached_at: string;
  updated_at: string;
}

export interface UserPaintingLike {
  id: string;
  user_id: string;
  painting_id: string; // UUID FK to paintings.id
  visit_id: string;
  liked_at: string;
}

export interface VisitPalette {
  id: string;
  visit_id: string;
  created_at: string;
  updated_at: string;
}

export interface VisitPalettePainting {
  id: string;
  palette_id: string;
  painting_id: string; // UUID FK to paintings.id
  position: number;    // 0-7
  added_at: string;
}

export interface CanonPalette {
  id: string;
  user_id: string;
  painting_ids: string[]; // Array of painting UUIDs
  created_at: string;
  updated_at: string;
}
