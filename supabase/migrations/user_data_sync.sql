-- =============================================================================
-- Migration: User Data Sync
-- Description: Adds user_collection and user_palette tables for remote
--              persistence of user collection and palette data.
-- =============================================================================

-- Ensure UUID extension is available
CREATE
EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- user_collection: links a user to a painting with status metadata
CREATE TABLE IF NOT EXISTS user_collection
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    painting_id UUID NOT NULL REFERENCES paintings
(
    id
)
  ON DELETE CASCADE,
    is_seen BOOLEAN NOT NULL DEFAULT false,
    want_to_visit BOOLEAN NOT NULL DEFAULT false,
    seen_date TIMESTAMPTZ,
    date_added TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),

    -- Prevent duplicate entries for the same user + painting
    CONSTRAINT uq_user_collection_user_painting UNIQUE
(
    user_id,
    painting_id
),

    -- is_seen and want_to_visit cannot both be true
    CONSTRAINT chk_user_collection_status_exclusivity CHECK
(
    NOT
(
    is_seen
    AND
    want_to_visit
))
    );

-- user_palette: one row per user with an ordered array of painting IDs (max 8)
CREATE TABLE IF NOT EXISTS user_palette
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    painting_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),

    -- One palette per user
    CONSTRAINT uq_user_palette_user UNIQUE
(
    user_id
),

    -- Palette can hold at most 8 paintings
    CONSTRAINT chk_user_palette_max_size CHECK
(
    array_length
(
    painting_ids,
    1
) IS NULL OR array_length
(
    painting_ids,
    1
) <= 8)
    );

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_collection_user_id ON user_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_painting_id ON user_collection(painting_id);

-- =============================================================================
-- 3. TRIGGER FUNCTION (idempotent via OR REPLACE)
-- =============================================================================

CREATE
OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at
= NOW();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- Drop existing triggers first for idempotency, then recreate
DROP TRIGGER IF EXISTS update_user_collection_updated_at ON user_collection;
CREATE TRIGGER update_user_collection_updated_at
    BEFORE UPDATE
    ON user_collection
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_palette_updated_at ON user_palette;
CREATE TRIGGER update_user_palette_updated_at
    BEFORE UPDATE
    ON user_palette
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_palette ENABLE ROW LEVEL SECURITY;

-- user_collection policies
DROP
POLICY IF EXISTS "Users can view own collection" ON user_collection;
CREATE
POLICY "Users can view own collection"
  ON user_collection
  FOR
SELECT
    USING (auth.uid() = user_id);

DROP
POLICY IF EXISTS "Users can insert own collection" ON user_collection;
CREATE
POLICY "Users can insert own collection"
  ON user_collection
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP
POLICY IF EXISTS "Users can update own collection" ON user_collection;
CREATE
POLICY "Users can update own collection"
  ON user_collection
  FOR
UPDATE
    USING (auth.uid() = user_id);

DROP
POLICY IF EXISTS "Users can delete own collection" ON user_collection;
CREATE
POLICY "Users can delete own collection"
  ON user_collection
  FOR DELETE
USING (auth.uid() = user_id);

-- user_palette policies
DROP
POLICY IF EXISTS "Users can view own palette" ON user_palette;
CREATE
POLICY "Users can view own palette"
  ON user_palette
  FOR
SELECT
    USING (auth.uid() = user_id);

DROP
POLICY IF EXISTS "Users can insert own palette" ON user_palette;
CREATE
POLICY "Users can insert own palette"
  ON user_palette
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP
POLICY IF EXISTS "Users can update own palette" ON user_palette;
CREATE
POLICY "Users can update own palette"
  ON user_palette
  FOR
UPDATE
    USING (auth.uid() = user_id);
