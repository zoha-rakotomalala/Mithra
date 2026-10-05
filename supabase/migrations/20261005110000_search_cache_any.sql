-- The Search screen now sends one query for artist and title alike
-- (search_type = 'any', see src/services/types/museumAdapter.ts). The cache
-- CHECK only knew 'artist' and 'title', so those searches skipped the cache.
-- Widen it. The UNIQUE (query, search_type, museum_id) key and the lookup
-- index are unchanged: 'any' is simply a third value in the same column.

ALTER TABLE public.search_cache
    DROP CONSTRAINT IF EXISTS search_cache_search_type_check;

ALTER TABLE public.search_cache
    ADD CONSTRAINT search_cache_search_type_check
        CHECK (search_type = ANY (ARRAY['any'::text, 'artist'::text, 'title'::text]));
