-- =============================================================================
-- DATABASE MIGRATION RUNBOOK
-- Run each numbered block ONE AT A TIME in DataGrip.
-- After each block, check for errors before running the next.
-- If anything goes wrong, jump to the RESTORE section at the bottom.
-- =============================================================================


-- =============================================================================
-- RESTORE (run this first if you need to reset to backups)
-- =============================================================================

-- RESTORE-1: Drop everything that was added by failed migrations
-- Run this block if you need to start over from your backups.
-- Safe to run even if some of these don't exist yet.


DROP TABLE IF EXISTS visit_palette_paintings CASCADE;
DROP TABLE IF EXISTS visit_palettes CASCADE;
DROP TABLE IF EXISTS _painting_id_migration_map CASCADE;
DROP TABLE IF EXISTS _palette_migration_temp CASCADE;
DROP TABLE IF EXISTS museums CASCADE;

-- Remove columns added by migration 002 (if it partially ran)
ALTER TABLE paintings DROP COLUMN IF EXISTS new_id;
ALTER TABLE paintings DROP COLUMN IF EXISTS new_museum_id;
ALTER TABLE paintings DROP COLUMN IF EXISTS external_id;
ALTER TABLE paintings DROP COLUMN IF EXISTS thumbnail_url;
ALTER TABLE paintings DROP COLUMN IF EXISTS medium;
ALTER TABLE paintings DROP COLUMN IF EXISTS dimensions;
ALTER TABLE paintings DROP COLUMN IF EXISTS museum_id_new;
ALTER TABLE paintings DROP COLUMN IF EXISTS legacy_id;

-- Remove columns added by migration 003 (if it partially ran)
ALTER TABLE visits DROP COLUMN IF EXISTS museum_id_new;

-- Remove columns added by migration 004 (if it partially ran)
ALTER TABLE user_painting_likes DROP COLUMN IF EXISTS painting_id_new;

-- Drop constraints added by migrations (ignore errors if they don't exist)
ALTER TABLE paintings DROP CONSTRAINT IF EXISTS uq_paintings_museum_external;
ALTER TABLE paintings DROP CONSTRAINT IF EXISTS fk_paintings_museum;
ALTER TABLE visits DROP CONSTRAINT IF EXISTS fk_visits_museum;
ALTER TABLE visits DROP CONSTRAINT IF EXISTS uq_visits_user_museum_date;
ALTER TABLE user_painting_likes DROP CONSTRAINT IF EXISTS fk_likes_painting;
ALTER TABLE user_painting_likes DROP CONSTRAINT IF EXISTS fk_likes_visit;
ALTER TABLE user_painting_likes DROP CONSTRAINT IF EXISTS uq_likes_user_painting;

-- Drop triggers
DROP TRIGGER IF EXISTS museums_updated_at ON museums;
DROP TRIGGER IF EXISTS paintings_updated_at ON paintings;
DROP TRIGGER IF EXISTS visits_updated_at ON visits;
DROP TRIGGER IF EXISTS visit_palettes_updated_at ON visit_palettes;


-- RESTORE-2: Restore tables from backups
-- Only run after RESTORE-1 above.


-- Restore paintings
DROP TABLE IF EXISTS paintings;
ALTER TABLE paintings_backup RENAME TO paintings;

-- Restore user_painting_likes
DROP TABLE IF EXISTS user_painting_likes;
ALTER TABLE user_painting_likes_backup RENAME TO user_painting_likes;

-- Restore visits
DROP TABLE IF EXISTS visits;
ALTER TABLE visits_backup RENAME TO visits;

-- Restore visit_palettes
DROP TABLE IF EXISTS visit_palettes;
ALTER TABLE visit_palettes_backup RENAME TO visit_palettes;

-- Restore canon_palettes (if you backed it up)
DROP TABLE IF EXISTS canon_palettes;
ALTER TABLE canon_palettes_backup RENAME TO canon_palettes;


-- After restoring, verify row counts match what you had before:
-- SELECT 'paintings' as tbl, COUNT(*) FROM paintings
-- UNION ALL SELECT 'user_painting_likes', COUNT(*) FROM user_painting_likes
-- UNION ALL SELECT 'visits', COUNT(*) FROM visits;


-- =============================================================================
-- PRE-FLIGHT CHECKS
-- Run these before starting migrations to understand your data.
-- =============================================================================

-- CHECK-1: See what painting IDs look like (should be text like "met-12345")
SELECT id, museum_id, title FROM paintings LIMIT 10;

-- CHECK-2: See what like IDs look like
SELECT painting_id, visit_id FROM user_painting_likes LIMIT 10;

-- CHECK-3: Find duplicate paintings (museum_id + external portion)
-- If this returns rows, you have duplicates to clean up before migration 002
SELECT
  museum_id,
  CASE
    WHEN id ~ '^[a-z]+-(.+)' THEN regexp_replace(id, '^[a-z]+-', '')
    ELSE id
  END AS external_id,
  COUNT(*) as cnt
FROM paintings
GROUP BY 1, 2
HAVING COUNT(*) > 1;

-- CHECK-4: Find orphaned likes (painting_id not in paintings table)
SELECT painting_id, COUNT(*) as cnt
FROM user_painting_likes
WHERE painting_id NOT IN (SELECT id FROM paintings)
GROUP BY painting_id;


-- =============================================================================
-- STEP 1 of 6: Create museums table
-- =============================================================================

CREATE TABLE IF NOT EXISTS museums (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  location    TEXT,
  api_config  JSONB NOT NULL DEFAULT '{}',
  metadata    JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_museums_active     ON museums(is_active);
CREATE INDEX IF NOT EXISTS idx_museums_short_name ON museums(short_name);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS museums_updated_at ON museums;
CREATE TRIGGER museums_updated_at
  BEFORE UPDATE ON museums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO museums (name, short_name, location, api_config, metadata, is_active)
VALUES
  (
    'Metropolitan Museum of Art', 'MET', 'New York City, USA',
    '{"baseUrl":"https://collectionapi.metmuseum.org/public/collection/v1","searchEndpoint":"/search","objectEndpoint":"/objects/{id}","searchParams":{"defaultLimit":20,"imageRequired":true,"hasImagesParam":"hasImages"}}',
    '{"color":"#d4af37","country":"USA","tier":1,"legacyId":"MET"}', true
  ),
  (
    'Art Institute of Chicago', 'AIC', 'Chicago, Illinois, USA',
    '{"baseUrl":"https://api.artic.edu/api/v1","searchEndpoint":"/artworks/search","objectEndpoint":"/artworks/{id}","imageBaseUrl":"https://www.artic.edu/iiif/2","searchParams":{"defaultLimit":20,"imageRequired":true,"fields":"id,title,artist_display,date_display,medium_display,dimensions,image_id,thumbnail,color"}}',
    '{"color":"#A8DADC","country":"USA","tier":1,"legacyId":"CHICAGO"}', true
  ),
  (
    'Cleveland Museum of Art', 'CMA', 'Cleveland, Ohio, USA',
    '{"baseUrl":"https://openaccess-api.clevelandart.org/api","searchEndpoint":"/artworks","objectEndpoint":"/artworks/{id}","searchParams":{"defaultLimit":20,"imageRequired":true,"hasImageParam":"has_image"}}',
    '{"color":"#457B9D","country":"USA","tier":1,"legacyId":"CLEVELAND"}', true
  ),
  (
    'Rijksmuseum', 'Rijks', 'Amsterdam, Netherlands',
    '{"baseUrl":"https://data.rijksmuseum.nl","searchEndpoint":"/search/collection","objectEndpoint":"/collection/{id}","searchParams":{"defaultLimit":20,"imageRequired":true,"imageAvailableParam":"imageAvailable"}}',
    '{"color":"#E63946","country":"Netherlands","tier":1,"legacyId":"RIJKS"}', true
  ),
  (
    'Harvard Art Museums', 'Harvard', 'Cambridge, Massachusetts, USA',
    '{"baseUrl":"https://api.harvardartmuseums.org","searchEndpoint":"/object","objectEndpoint":"/object/{id}","searchParams":{"defaultLimit":20,"imageRequired":true,"hasImageParam":"hasimage"}}',
    '{"color":"#A4161A","country":"USA","tier":2,"legacyId":"HARVARD"}', true
  ),
  (
    'Victoria and Albert Museum', 'V&A', 'London, UK',
    '{"baseUrl":"https://api.vam.ac.uk/v2","searchEndpoint":"/objects/search","objectEndpoint":"/object/{id}","searchParams":{"defaultLimit":20,"imageRequired":true}}',
    '{"color":"#6A4C93","country":"UK","tier":2,"legacyId":"VA"}', true
  ),
  (
    'National Gallery', 'NG', 'London, UK',
    '{"baseUrl":"https://www.nationalgallery.org.uk/api","searchEndpoint":"/search","objectEndpoint":"/paintings/{id}","searchParams":{"defaultLimit":20,"imageRequired":true}}',
    '{"color":"#2D6A4F","country":"UK","tier":2,"legacyId":"NG"}', true
  ),
  (
    'Europeana', 'Europeana', 'Europe',
    '{"baseUrl":"https://api.europeana.eu/record/v2","searchEndpoint":"/search.json","objectEndpoint":"/record/{id}.json","searchParams":{"defaultLimit":20,"imageRequired":true,"mediaParam":"MEDIA"}}',
    '{"color":"#1E3A8A","country":"Europe","tier":3,"legacyId":"EUROPEANA"}', true
  ),
  (
    'Paris Musées', 'Paris', 'Paris, France',
    '{"baseUrl":"https://api.parismusees.paris.fr","searchEndpoint":"/search","objectEndpoint":"/object/{id}","searchParams":{"defaultLimit":20,"imageRequired":true}}',
    '{"color":"#DB2777","country":"France","tier":3,"legacyId":"PARIS"}', true
  )
ON CONFLICT DO NOTHING;

-- Verify: should return 9 rows
SELECT id, name, short_name FROM museums ORDER BY name;


-- =============================================================================
-- STEP 2a of 6: Paintings — drop blocking FK, add new columns
-- =============================================================================

-- Drop any FK from user_painting_likes that points at paintings.id
-- (prevents us from changing the primary key)
ALTER TABLE user_painting_likes
  DROP CONSTRAINT IF EXISTS user_painting_likes_painting_id_fkey;
ALTER TABLE user_painting_likes
  DROP CONSTRAINT IF EXISTS fk_likes_painting;

-- Add new columns
ALTER TABLE paintings
  ADD COLUMN IF NOT EXISTS new_id        UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS new_museum_id UUID,
  ADD COLUMN IF NOT EXISTS external_id   TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS medium        TEXT,
  ADD COLUMN IF NOT EXISTS dimensions    TEXT;

-- Verify columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'paintings'
ORDER BY ordinal_position;


-- =============================================================================
-- STEP 2b of 6: Paintings — populate new columns
-- =============================================================================

-- Resolve museum UUIDs from legacy short IDs
UPDATE paintings p
SET new_museum_id = m.id
FROM museums m
WHERE m.metadata->>'legacyId' = p.museum_id;

-- Check how many resolved (should be close to total row count)
SELECT
  COUNT(*) FILTER (WHERE new_museum_id IS NOT NULL) AS resolved,
  COUNT(*) FILTER (WHERE new_museum_id IS NULL)     AS unresolved,
  COUNT(*)                                           AS total
FROM paintings;

-- Extract external_id from legacy text ID (e.g. "met-12345" → "12345")
UPDATE paintings
SET external_id = CASE
  WHEN id ~ '^[a-z]+-(.+)' THEN regexp_replace(id, '^[a-z]+-', '')
  ELSE id
END;

-- For any paintings whose museum didn't resolve, assign to first active museum
-- (these are edge cases — review them after migration)
UPDATE paintings
SET new_museum_id = (SELECT id FROM museums WHERE is_active = true LIMIT 1)
WHERE new_museum_id IS NULL;


-- =============================================================================
-- STEP 2c of 6: Paintings — deduplicate before adding unique constraint
-- =============================================================================

-- See duplicates
SELECT new_museum_id, external_id, COUNT(*)
FROM paintings
GROUP BY new_museum_id, external_id
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping the most recently updated row
-- (skip this block if the query above returned 0 rows)
DELETE FROM paintings
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY new_museum_id, external_id
             ORDER BY updated_at DESC NULLS LAST
           ) AS rn
    FROM paintings
  ) ranked
  WHERE rn > 1
);


-- =============================================================================
-- STEP 2d of 6: Paintings — build mapping table and swap primary key
-- =============================================================================

-- Create mapping table (old text ID → new UUID)
DROP TABLE IF EXISTS _painting_id_migration_map;
CREATE TABLE _painting_id_migration_map (
  old_id TEXT PRIMARY KEY,
  new_id UUID NOT NULL
);

INSERT INTO _painting_id_migration_map (old_id, new_id)
SELECT id, new_id FROM paintings
ON CONFLICT (old_id) DO NOTHING;

-- Verify mapping count matches paintings count
SELECT COUNT(*) FROM _painting_id_migration_map;
SELECT COUNT(*) FROM paintings;

-- Drop old primary key and swap columns
ALTER TABLE paintings DROP CONSTRAINT IF EXISTS paintings_pkey CASCADE;
ALTER TABLE paintings RENAME COLUMN id TO legacy_id;
ALTER TABLE paintings RENAME COLUMN new_id TO id;
ALTER TABLE paintings RENAME COLUMN new_museum_id TO museum_id_new;
ALTER TABLE paintings DROP COLUMN IF EXISTS museum_id;
ALTER TABLE paintings RENAME COLUMN museum_id_new TO museum_id;
ALTER TABLE paintings ADD PRIMARY KEY (id);
ALTER TABLE paintings ALTER COLUMN museum_id SET NOT NULL;
ALTER TABLE paintings ALTER COLUMN external_id SET NOT NULL;

-- Add constraints and indexes
ALTER TABLE paintings
  ADD CONSTRAINT uq_paintings_museum_external UNIQUE (museum_id, external_id);
ALTER TABLE paintings
  ADD CONSTRAINT fk_paintings_museum
  FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE RESTRICT;
ALTER TABLE paintings ALTER COLUMN title SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paintings_museum      ON paintings(museum_id);
CREATE INDEX IF NOT EXISTS idx_paintings_external_id ON paintings(external_id);

DROP TRIGGER IF EXISTS paintings_updated_at ON paintings;
CREATE TRIGGER paintings_updated_at
  BEFORE UPDATE ON paintings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify: check a few rows look correct
SELECT id, museum_id, external_id, title FROM paintings LIMIT 5;


-- =============================================================================
-- STEP 3 of 6: Update visits table
-- =============================================================================

-- Truncate visits since you said you don't care about this data
TRUNCATE TABLE visits CASCADE;

-- Add new UUID museum_id column
ALTER TABLE visits ADD COLUMN IF NOT EXISTS museum_id_new UUID;

-- Drop old text museum_id and rename
ALTER TABLE visits DROP COLUMN IF EXISTS museum_id;
ALTER TABLE visits RENAME COLUMN museum_id_new TO museum_id;
ALTER TABLE visits DROP COLUMN IF EXISTS museum_name;

-- Add constraints
ALTER TABLE visits
  ADD CONSTRAINT fk_visits_museum
  FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE RESTRICT;

ALTER TABLE visits
  ADD CONSTRAINT uq_visits_user_museum_date
  UNIQUE (user_id, museum_id, visit_date);

CREATE INDEX IF NOT EXISTS idx_visits_user    ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_museum  ON visits(museum_id);
CREATE INDEX IF NOT EXISTS idx_visits_date    ON visits(visit_date DESC);

DROP TRIGGER IF EXISTS visits_updated_at ON visits;
CREATE TRIGGER visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify: should be empty (we truncated) with correct columns
SELECT COUNT(*) FROM visits;
SELECT column_name FROM information_schema.columns WHERE table_name = 'visits' ORDER BY ordinal_position;


-- =============================================================================
-- STEP 4a of 6: user_painting_likes — inspect orphans before touching data
-- =============================================================================

-- See how many likes can be resolved to new painting UUIDs
SELECT
  COUNT(*) FILTER (WHERE m.new_id IS NOT NULL) AS will_survive,
  COUNT(*) FILTER (WHERE m.new_id IS NULL)     AS will_be_deleted,
  COUNT(*)                                      AS total
FROM user_painting_likes upl
LEFT JOIN _painting_id_migration_map m ON m.old_id = upl.painting_id;

-- If "will_be_deleted" is more than you expect, stop here and investigate:
-- SELECT upl.painting_id FROM user_painting_likes upl
-- LEFT JOIN _painting_id_migration_map m ON m.old_id = upl.painting_id
-- WHERE m.new_id IS NULL;


-- =============================================================================
-- STEP 4b of 6: user_painting_likes — migrate painting IDs
-- =============================================================================

-- Add new UUID column
ALTER TABLE user_painting_likes
  ADD COLUMN IF NOT EXISTS painting_id_new UUID;

-- Resolve old text IDs to new UUIDs
UPDATE user_painting_likes upl
SET painting_id_new = m.new_id
FROM _painting_id_migration_map m
WHERE m.old_id = upl.painting_id;

-- Delete orphaned likes (painting not found in paintings table)
DELETE FROM user_painting_likes WHERE painting_id_new IS NULL;

-- Swap columns
ALTER TABLE user_painting_likes DROP COLUMN IF EXISTS painting_id;
ALTER TABLE user_painting_likes RENAME COLUMN painting_id_new TO painting_id;
ALTER TABLE user_painting_likes ALTER COLUMN painting_id SET NOT NULL;

-- Cast visit_id to UUID if it's stored as TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_painting_likes'
      AND column_name = 'visit_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE user_painting_likes
      ALTER COLUMN visit_id TYPE UUID USING visit_id::UUID;
  END IF;
END $$;

-- Add constraints
ALTER TABLE user_painting_likes
  ADD CONSTRAINT fk_likes_painting
  FOREIGN KEY (painting_id) REFERENCES paintings(id) ON DELETE CASCADE;
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'visits'::regclass AND contype = 'p'
        )
        THEN ALTER TABLE visits ADD PRIMARY KEY (id);
        END IF;
    END $$;

end;
ALTER TABLE user_painting_likes
  ADD CONSTRAINT fk_likes_visit
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL;

ALTER TABLE user_painting_likes
  ADD CONSTRAINT uq_likes_user_painting
  UNIQUE (user_id, painting_id);

CREATE INDEX IF NOT EXISTS idx_likes_user     ON user_painting_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_painting ON user_painting_likes(painting_id);
CREATE INDEX IF NOT EXISTS idx_likes_visit    ON user_painting_likes(visit_id);

-- Verify
SELECT COUNT(*) FROM user_painting_likes;
SELECT painting_id FROM user_painting_likes LIMIT 5;


-- =============================================================================
-- STEP 5 of 6: Create visit_palettes and visit_palette_paintings tables
-- =============================================================================

DROP TABLE IF EXISTS visit_palettes CASCADE;

CREATE TABLE visit_palettes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id   UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (visit_id)
);

CREATE INDEX IF NOT EXISTS idx_palettes_visit ON visit_palettes(visit_id);

DROP TRIGGER IF EXISTS visit_palettes_updated_at ON visit_palettes;
CREATE TRIGGER visit_palettes_updated_at
  BEFORE UPDATE ON visit_palettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS visit_palette_paintings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palette_id  UUID NOT NULL REFERENCES visit_palettes(id) ON DELETE CASCADE,
  painting_id UUID NOT NULL REFERENCES paintings(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL CHECK (position >= 0 AND position < 8),
  added_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (palette_id, painting_id),
  UNIQUE (palette_id, position)
);

CREATE INDEX IF NOT EXISTS idx_palette_paintings_palette  ON visit_palette_paintings(palette_id);
CREATE INDEX IF NOT EXISTS idx_palette_paintings_position ON visit_palette_paintings(palette_id, position);

-- Clean up migration temp tables
DROP TABLE IF EXISTS _painting_id_migration_map;
DROP TABLE IF EXISTS _palette_migration_temp;

-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('visit_palettes', 'visit_palette_paintings', 'museums', 'paintings')
ORDER BY table_name;


-- =============================================================================
-- STEP 6 of 6: Add Row Level Security policies
-- =============================================================================

-- Museums
ALTER TABLE museums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS museums_select ON museums;
CREATE POLICY museums_select ON museums FOR SELECT TO authenticated USING (true);

-- Paintings
ALTER TABLE paintings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS paintings_select ON paintings;
DROP POLICY IF EXISTS paintings_insert ON paintings;
DROP POLICY IF EXISTS paintings_update ON paintings;
CREATE POLICY paintings_select ON paintings FOR SELECT TO authenticated USING (true);
CREATE POLICY paintings_insert ON paintings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY paintings_update ON paintings FOR UPDATE TO authenticated USING (true);

-- Visits
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS visits_select ON visits;
DROP POLICY IF EXISTS visits_insert ON visits;
DROP POLICY IF EXISTS visits_update ON visits;
DROP POLICY IF EXISTS visits_delete ON visits;
CREATE POLICY visits_select ON visits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY visits_insert ON visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY visits_update ON visits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY visits_delete ON visits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_painting_likes
ALTER TABLE user_painting_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS likes_select ON user_painting_likes;
DROP POLICY IF EXISTS likes_insert ON user_painting_likes;
DROP POLICY IF EXISTS likes_delete ON user_painting_likes;
CREATE POLICY likes_select ON user_painting_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY likes_insert ON user_painting_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_delete ON user_painting_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- visit_palettes
ALTER TABLE visit_palettes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS palettes_select ON visit_palettes;
DROP POLICY IF EXISTS palettes_insert ON visit_palettes;
DROP POLICY IF EXISTS palettes_update ON visit_palettes;
DROP POLICY IF EXISTS palettes_delete ON visit_palettes;
CREATE POLICY palettes_select ON visit_palettes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM visits v WHERE v.id = visit_palettes.visit_id AND v.user_id = auth.uid()));
CREATE POLICY palettes_insert ON visit_palettes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM visits v WHERE v.id = visit_palettes.visit_id AND v.user_id = auth.uid()));
CREATE POLICY palettes_update ON visit_palettes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM visits v WHERE v.id = visit_palettes.visit_id AND v.user_id = auth.uid()));
CREATE POLICY palettes_delete ON visit_palettes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM visits v WHERE v.id = visit_palettes.visit_id AND v.user_id = auth.uid()));

-- visit_palette_paintings
ALTER TABLE visit_palette_paintings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS palette_paintings_select ON visit_palette_paintings;
DROP POLICY IF EXISTS palette_paintings_insert ON visit_palette_paintings;
DROP POLICY IF EXISTS palette_paintings_delete ON visit_palette_paintings;
CREATE POLICY palette_paintings_select ON visit_palette_paintings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM visit_palettes vp JOIN visits v ON v.id = vp.visit_id WHERE vp.id = visit_palette_paintings.palette_id AND v.user_id = auth.uid()));
CREATE POLICY palette_paintings_insert ON visit_palette_paintings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM visit_palettes vp JOIN visits v ON v.id = vp.visit_id WHERE vp.id = visit_palette_paintings.palette_id AND v.user_id = auth.uid()));
CREATE POLICY palette_paintings_delete ON visit_palette_paintings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM visit_palettes vp JOIN visits v ON v.id = vp.visit_id WHERE vp.id = visit_palette_paintings.palette_id AND v.user_id = auth.uid()));

-- Final verification: list all tables and their row counts
SELECT 'museums' AS tbl, COUNT(*) FROM museums
UNION ALL SELECT 'paintings', COUNT(*) FROM paintings
UNION ALL SELECT 'user_painting_likes', COUNT(*) FROM user_painting_likes
UNION ALL SELECT 'visits', COUNT(*) FROM visits
UNION ALL SELECT 'visit_palettes', COUNT(*) FROM visit_palettes
UNION ALL SELECT 'visit_palette_paintings', COUNT(*) FROM visit_palette_paintings
ORDER BY tbl;
