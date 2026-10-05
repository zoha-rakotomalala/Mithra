-- Museum directory: every museum Wikidata knows with a painting collection,
-- refreshed monthly by tools/update-museums.mjs (GitHub Actions, 1st of the
-- month). The app reads it to answer "which museum am I in" and "what is
-- near me", and shows painting_count / image_count so a visitor knows what
-- to expect before the first search.
--
-- HOW TO APPLY
--
--   Dashboard: SQL Editor -> New query -> paste this file -> Run.
--   CLI:       npx supabase link --project-ref <ref> && npx supabase db push
--   GitHub integration (if enabled on the project): applied on merge to main.
--
-- Idempotent: safe to run twice.

CREATE TABLE IF NOT EXISTS public.museums
(
    qid            TEXT PRIMARY KEY,                     -- Wikidata id, e.g. Q190804
    name           TEXT NOT NULL,
    city           TEXT,
    country        TEXT,
    lat            DOUBLE PRECISION,
    lng            DOUBLE PRECISION,
    painting_count INTEGER     NOT NULL DEFAULT 0,       -- paintings with P195 = this museum
    image_count    INTEGER     NOT NULL DEFAULT 0,       -- of which with an image (P18)
    collection_qids TEXT[]     NOT NULL DEFAULT '{}',  -- P195 values that hold this museum's paintings (departments, shared collections)
    website        TEXT,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.museums IS
    'Museum directory from Wikidata (collections with >= 100 paintings and coordinates). Refreshed monthly by tools/update-museums.mjs.';

-- "Near me" is a bounding-box query on lat/lng; 2,000 rows need no PostGIS.
CREATE INDEX IF NOT EXISTS museums_lat_lng_idx ON public.museums (lat, lng);
CREATE INDEX IF NOT EXISTS museums_painting_count_idx ON public.museums (painting_count DESC);
CREATE INDEX IF NOT EXISTS museums_name_idx ON public.museums (lower(name));

-- Everyone may read; only the service role (which bypasses RLS) writes.
ALTER TABLE public.museums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "museums are readable by everyone" ON public.museums;
CREATE POLICY "museums are readable by everyone"
    ON public.museums FOR SELECT
    USING (true);
