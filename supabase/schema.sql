-- Mithra Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we can extend it)
-- No need to create, use auth.users

-- Visits table
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  museum_id TEXT NOT NULL,
  museum_name TEXT NOT NULL,
  visit_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paintings table (cached from museum APIs)
CREATE TABLE paintings (
  id TEXT PRIMARY KEY,  -- Format: "met-12345", "rijks-SK-A-1234"
  museum_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  color TEXT,  -- Fallback color
  metadata JSONB,  -- Store full API response for flexibility
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster museum queries
CREATE INDEX idx_paintings_museum ON paintings(museum_id);
CREATE INDEX idx_paintings_artist ON paintings(artist);

-- User painting likes (many-to-many)
CREATE TABLE user_painting_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  painting_id TEXT REFERENCES paintings(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, painting_id, visit_id)
);

-- Indexes for faster queries
CREATE INDEX idx_likes_user ON user_painting_likes(user_id);
CREATE INDEX idx_likes_visit ON user_painting_likes(visit_id);
CREATE INDEX idx_likes_painting ON user_painting_likes(painting_id);

-- Visit palettes (8 artworks per visit)
CREATE TABLE visit_palettes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE UNIQUE,
  painting_ids TEXT[] NOT NULL CHECK (array_length(painting_ids, 1) = 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canon palette (one per user - ultimate 8 artworks)
CREATE TABLE canon_palettes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  painting_ids TEXT[] NOT NULL CHECK (array_length(painting_ids, 1) = 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE paintings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_painting_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canon_palettes ENABLE ROW LEVEL SECURITY;

-- Visits: Users can only see their own visits
CREATE POLICY "Users can view own visits" ON visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits" ON visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits" ON visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits" ON visits
  FOR DELETE USING (auth.uid() = user_id);

-- Paintings: Everyone can read (cached data), only system can write
CREATE POLICY "Anyone can view paintings" ON paintings
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert paintings" ON paintings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update paintings" ON paintings
  FOR UPDATE USING (true);

-- User likes: Users can only see/modify their own likes
CREATE POLICY "Users can view own likes" ON user_painting_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes" ON user_painting_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON user_painting_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Visit palettes: Users can only see/modify palettes for their visits
CREATE POLICY "Users can view own visit palettes" ON visit_palettes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visits 
      WHERE visits.id = visit_palettes.visit_id 
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own visit palettes" ON visit_palettes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits 
      WHERE visits.id = visit_palettes.visit_id 
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own visit palettes" ON visit_palettes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM visits 
      WHERE visits.id = visit_palettes.visit_id 
      AND visits.user_id = auth.uid()
    )
  );

-- Canon palettes: Users can only see/modify their own canon palette
CREATE POLICY "Users can view own canon palette" ON canon_palettes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canon palette" ON canon_palettes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canon palette" ON canon_palettes
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paintings_updated_at BEFORE UPDATE ON paintings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_palettes_updated_at BEFORE UPDATE ON visit_palettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canon_palettes_updated_at BEFORE UPDATE ON canon_palettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
