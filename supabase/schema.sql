-- =============================================================================
-- Palette Database Schema
-- Complete reference of the current production database schema.
-- Last updated: 2026-03-20
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Museums
CREATE TABLE public.museums (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  location TEXT,
  api_config JSONB DEFAULT '{}'::jsonb NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Paintings (cached from museum APIs)
CREATE TABLE public.paintings (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  legacy_id TEXT,
  museum_id UUID NOT NULL CONSTRAINT fk_paintings_museum REFERENCES public.museums ON DELETE RESTRICT,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  year TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  color TEXT,
  medium TEXT,
  dimensions TEXT,
  metadata JSONB,
  cached_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  verification_source TEXT,
  verification_status TEXT,
  CONSTRAINT uq_paintings_museum_external UNIQUE (museum_id, external_id)
);

-- Visits
CREATE TABLE public.visits (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID,
  museum_id UUID CONSTRAINT fk_visits_museum REFERENCES public.museums ON DELETE RESTRICT,
  visit_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  CONSTRAINT uq_visits_user_museum_date UNIQUE (user_id, museum_id, visit_date)
);

-- User painting likes (many-to-many)
CREATE TABLE public.user_painting_likes (
  id UUID,
  user_id UUID,
  painting_id UUID NOT NULL CONSTRAINT fk_likes_painting REFERENCES public.paintings ON DELETE CASCADE,
  visit_id UUID CONSTRAINT fk_likes_visit REFERENCES public.visits ON DELETE SET NULL,
  liked_at TIMESTAMPTZ,
  CONSTRAINT uq_likes_user_painting UNIQUE (user_id, painting_id)
);

-- Visit palettes (one per visit)
CREATE TABLE public.visit_palettes (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  visit_id UUID NOT NULL UNIQUE REFERENCES public.visits ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Visit palette paintings (junction table, max 8 per palette)
CREATE TABLE public.visit_palette_paintings (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  palette_id UUID NOT NULL REFERENCES public.visit_palettes ON DELETE CASCADE,
  painting_id UUID NOT NULL REFERENCES public.paintings ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position < 8),
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (palette_id, painting_id),
  UNIQUE (palette_id, position)
);

-- Canon palettes (legacy, one per user)
CREATE TABLE public.canon_palettes (
  id UUID,
  user_id UUID,
  painting_ids TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Search cache
CREATE TABLE public.search_cache (
  id UUID DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type = ANY (ARRAY['artist'::text, 'title'::text])),
  museum_id TEXT NOT NULL,
  painting_ids TEXT[] NOT NULL,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  verification_status TEXT DEFAULT 'fresh'::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (query, search_type, museum_id)
);

-- User collection: links a user to a painting with status metadata
CREATE TABLE public.user_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  painting_id UUID NOT NULL REFERENCES public.paintings(id) ON DELETE CASCADE,
  is_seen BOOLEAN NOT NULL DEFAULT false,
  want_to_visit BOOLEAN NOT NULL DEFAULT false,
  seen_date TIMESTAMPTZ,
  date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_collection_user_painting UNIQUE (user_id, painting_id),
  CONSTRAINT chk_user_collection_status_exclusivity CHECK (NOT (is_seen AND want_to_visit))
);

-- User palette: one row per user, ordered array of painting UUIDs (max 8)
CREATE TABLE public.user_palette (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  painting_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_palette_user UNIQUE (user_id),
  CONSTRAINT chk_user_palette_max_size CHECK (array_length(painting_ids, 1) IS NULL OR array_length(painting_ids, 1) <= 8)
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX idx_museums_active ON public.museums (is_active);
CREATE INDEX idx_museums_short_name ON public.museums (short_name);

CREATE INDEX idx_paintings_museum ON public.paintings (museum_id);
CREATE INDEX idx_paintings_external_id ON public.paintings (external_id);

CREATE INDEX idx_visits_user ON public.visits (user_id);
CREATE INDEX idx_visits_museum ON public.visits (museum_id);
CREATE INDEX idx_visits_date ON public.visits (visit_date DESC);

CREATE INDEX idx_likes_user ON public.user_painting_likes (user_id);
CREATE INDEX idx_likes_painting ON public.user_painting_likes (painting_id);
CREATE INDEX idx_likes_visit ON public.user_painting_likes (visit_id);

CREATE INDEX idx_palettes_visit ON public.visit_palettes (visit_id);

CREATE INDEX idx_palette_paintings_palette ON public.visit_palette_paintings (palette_id);
CREATE INDEX idx_palette_paintings_position ON public.visit_palette_paintings (palette_id, position);

CREATE INDEX idx_search_cache_lookup ON public.search_cache (query, search_type, museum_id);
CREATE INDEX idx_search_cache_verified ON public.search_cache (last_verified_at);

CREATE INDEX idx_user_collection_user_id ON public.user_collection (user_id);
CREATE INDEX idx_user_collection_painting_id ON public.user_collection (painting_id);

-- =============================================================================
-- 3. TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

CREATE TRIGGER update_user_collection_updated_at
  BEFORE UPDATE ON public.user_collection
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_palette_updated_at
  BEFORE UPDATE ON public.user_palette
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_palette ENABLE ROW LEVEL SECURITY;

-- user_collection policies
CREATE POLICY "Users can view own collection" ON public.user_collection
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collection" ON public.user_collection
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collection" ON public.user_collection
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collection" ON public.user_collection
  FOR DELETE USING (auth.uid() = user_id);

-- user_palette policies
CREATE POLICY "Users can view own palette" ON public.user_palette
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own palette" ON public.user_palette
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own palette" ON public.user_palette
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 6. BACKUP TABLES (legacy, kept for reference)
-- =============================================================================

-- profiles_backup, paintings_backup, search_cache_backup, search_cache_backup_2,
-- user_painting_likes_backup, visits_backup, visit_palettes_backup, canon_palettes_backup
-- These are unstructured backup copies of earlier table versions. Not referenced by the app.
