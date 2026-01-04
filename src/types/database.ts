export interface Visit {
  id: string;
  user_id: string;
  museum_id: string;
  museum_name: string;
  visit_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Painting {
  id: string;
  museum_id: string;
  title: string;
  artist: string;
  year?: string;
  image_url?: string;
  thumbnail_url?: string;
  color?: string;
  metadata?: any;
  cached_at: string;
  updated_at: string;
}

export interface UserPaintingLike {
  id: string;
  user_id: string;
  painting_id: string;
  visit_id: string;
  liked_at: string;
}

export interface VisitPalette {
  id: string;
  visit_id: string;
  painting_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CanonPalette {
  id: string;
  user_id: string;
  painting_ids: string[];
  created_at: string;
  updated_at: string;
}
