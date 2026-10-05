-- Widen the search_cache CHECK constraint to accept search_type = 'any'.
--
-- HOW TO APPLY
--
-- This repo has no Supabase CLI project link (no supabase/config.toml), so
-- the quickest route is the dashboard:
--
--   1. Open https://supabase.com/dashboard, pick the Palette project (its
--      ref is the first part of SUPABASE_URL in your .env:
--      https://<ref>.supabase.co).
--   2. SQL Editor -> New query -> paste this whole file -> Run.
--   3. Check: Table Editor -> search_cache -> the search_type column's
--      check constraint now lists 'any', 'artist', 'title'.
--
-- Or with the CLI, once per machine:
--
--   npx supabase login
--   npx supabase link --project-ref <ref>
--   npx supabase db push          # applies every file in supabase/migrations
--
-- Safe to run twice: DROP ... IF EXISTS makes it idempotent. Until it is
-- applied, the app still works: cache writes for 'any' fail on the old
-- constraint and the per-museum guard in unifiedMuseumService keeps the
-- results (a console warning, nothing lost).
--
-- WHY
--
-- The Search screen now sends one query for artist and title alike
-- (search_type = 'any', see src/services/types/museumAdapter.ts). The cache
-- CHECK only knew 'artist' and 'title', so those searches skipped the cache.
-- The UNIQUE (query, search_type, museum_id) key and the lookup index are
-- unchanged: 'any' is simply a third value in the same column.

ALTER TABLE public.search_cache
    DROP CONSTRAINT IF EXISTS search_cache_search_type_check;

ALTER TABLE public.search_cache
    ADD CONSTRAINT search_cache_search_type_check
        CHECK (search_type = ANY (ARRAY['any'::text, 'artist'::text, 'title'::text]));
