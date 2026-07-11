SET
check_function_bodies = false;
DROP
EXTENSION pg_net;
CREATE
EXTENSION pg_trgm WITH SCHEMA public;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE
, INSERT, SELECT, UPDATE ON TABLES TO anon;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT
SELECT, USAGE
ON SEQUENCES TO anon;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE
, INSERT, SELECT, UPDATE ON TABLES TO authenticated;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT
SELECT, USAGE
ON SEQUENCES TO authenticated;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE
, INSERT, SELECT, UPDATE ON TABLES TO service_role;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT
SELECT, USAGE
ON SEQUENCES TO service_role;
ALTER
DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
CREATE FUNCTION public.delete_user()
    RETURNS void
    LANGUAGE sql
    SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
-- Delete all user data from application tables
DELETE
FROM public.user_collection
WHERE user_id = auth.uid();
DELETE
FROM public.user_palette
WHERE user_id = auth.uid();
DELETE
FROM public.user_painting_likes
WHERE user_id = auth.uid();
DELETE
FROM public.visits
WHERE user_id = auth.uid();

-- Delete the auth user (this signs them out permanently)
DELETE
FROM auth.users
WHERE id = auth.uid();
$function$;
GRANT
ALL
ON FUNCTION public.delete_user() TO anon;
GRANT ALL
ON FUNCTION public.delete_user() TO authenticated;
GRANT ALL
ON FUNCTION public.delete_user() TO service_role;
CREATE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
RETURN NEW;
END;$function$;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
GRANT
ALL
ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL
ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL
ON FUNCTION public.handle_new_user() TO service_role;
CREATE FUNCTION public.update_capture_clusters_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at
= NOW();
RETURN NEW;
END;
$function$;
GRANT ALL
ON FUNCTION public.update_capture_clusters_updated_at() TO anon;
GRANT ALL
ON FUNCTION public.update_capture_clusters_updated_at() TO authenticated;
GRANT ALL
ON FUNCTION public.update_capture_clusters_updated_at() TO service_role;
CREATE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at
= NOW();
RETURN NEW;
END;
$function$;
GRANT ALL
ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL
ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL
ON FUNCTION public.update_updated_at_column() TO service_role;
CREATE TABLE public.canon_palettes
(
    id           uuid,
    user_id      uuid,
    painting_ids text[],
    created_at   timestamp with time zone,
    updated_at   timestamp with time zone
);
ALTER TABLE public.canon_palettes ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.canon_palettes TO anon;
GRANT ALL
ON public.canon_palettes TO authenticated;
GRANT ALL
ON public.canon_palettes TO service_role;
CREATE TABLE public.canon_palettes_backup
(
    id           uuid,
    user_id      uuid,
    painting_ids text[],
    created_at   timestamp with time zone,
    updated_at   timestamp with time zone
);
ALTER TABLE public.canon_palettes_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.canon_palettes_backup TO anon;
GRANT ALL
ON public.canon_palettes_backup TO authenticated;
GRANT ALL
ON public.canon_palettes_backup TO service_role;
CREATE TABLE public.capture_cluster_members
(
    cluster_id  uuid NOT NULL,
    painting_id uuid NOT NULL,
    user_id     uuid NOT NULL,
    added_at    timestamp with time zone DEFAULT now()
);
ALTER TABLE public.capture_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_cluster_members
    ADD CONSTRAINT capture_cluster_members_pkey PRIMARY KEY (cluster_id, user_id);
ALTER TABLE public.capture_cluster_members
    ADD CONSTRAINT capture_cluster_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
GRANT
ALL
ON public.capture_cluster_members TO anon;
GRANT ALL
ON public.capture_cluster_members TO authenticated;
GRANT ALL
ON public.capture_cluster_members TO service_role;
CREATE INDEX idx_cluster_members_painting ON public.capture_cluster_members (painting_id);
CREATE
POLICY members_own_insert ON public.capture_cluster_members FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE
POLICY members_own_select ON public.capture_cluster_members FOR
SELECT USING ((user_id = auth.uid()));
CREATE TABLE public.capture_clusters
(
    id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
    title_norm  text                                               NOT NULL,
    artist_norm text                                               NOT NULL,
    entry_count integer                  DEFAULT 1,
    promoted    boolean                  DEFAULT false,
    promoted_at timestamp with time zone,
    painting_id uuid,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
);
ALTER TABLE public.capture_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_clusters
    ADD CONSTRAINT capture_clusters_pkey PRIMARY KEY (id);
ALTER TABLE public.capture_cluster_members
    ADD CONSTRAINT capture_cluster_members_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES public.capture_clusters (id) ON DELETE CASCADE;
ALTER TABLE public.capture_clusters
    ADD CONSTRAINT capture_clusters_title_norm_artist_norm_key UNIQUE (title_norm, artist_norm);
GRANT
ALL
ON public.capture_clusters TO anon;
GRANT ALL
ON public.capture_clusters TO authenticated;
GRANT ALL
ON public.capture_clusters TO service_role;
CREATE INDEX idx_clusters_unpromoted ON public.capture_clusters (promoted) WHERE promoted = false;
CREATE INDEX idx_clusters_title_artist ON public.capture_clusters (title_norm, artist_norm);
CREATE TRIGGER trg_capture_clusters_updated_at
    BEFORE UPDATE
    ON public.capture_clusters
    FOR EACH ROW EXECUTE FUNCTION public.update_capture_clusters_updated_at();
CREATE
POLICY clusters_auth_insert ON public.capture_clusters FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));
CREATE
POLICY clusters_auth_select ON public.capture_clusters FOR
SELECT USING ((auth.uid() IS NOT NULL));
CREATE
POLICY clusters_auth_update ON public.capture_clusters FOR
UPDATE USING ((auth.uid() IS NOT NULL));
CREATE TABLE public.museums
(
    id              uuid                     DEFAULT gen_random_uuid() NOT NULL,
    name            text                                               NOT NULL,
    short_name      text                                               NOT NULL,
    location        text,
    api_config      jsonb                    DEFAULT '{}'::jsonb NOT NULL,
    metadata        jsonb                    DEFAULT '{}'::jsonb NOT NULL,
    is_active       boolean                  DEFAULT true              NOT NULL,
    created_at      timestamp with time zone DEFAULT now()             NOT NULL,
    updated_at      timestamp with time zone DEFAULT now()             NOT NULL,
    created_by      uuid,
    is_user_created boolean                  DEFAULT false
);
ALTER TABLE public.museums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.museums
    ADD CONSTRAINT museums_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id);
ALTER TABLE public.museums
    ADD CONSTRAINT museums_pkey PRIMARY KEY (id);
GRANT
ALL
ON public.museums TO anon;
GRANT ALL
ON public.museums TO authenticated;
GRANT ALL
ON public.museums TO service_role;
CREATE INDEX idx_museums_active ON public.museums (is_active);
CREATE INDEX idx_museums_short_name ON public.museums (short_name);
CREATE TRIGGER museums_updated_at
    BEFORE UPDATE
    ON public.museums
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE
POLICY museums_auth_insert ON public.museums FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (is_user_created = true)));
CREATE
POLICY museums_public_read ON public.museums FOR
SELECT USING (true);
CREATE
POLICY museums_select ON public.museums FOR
SELECT TO authenticated USING (true);
CREATE TABLE public.paintings
(
    legacy_id            text,
    title                text                           NOT NULL,
    artist               text,
    year                 text,
    image_url            text,
    thumbnail_url        text,
    color                text,
    metadata             jsonb,
    cached_at            timestamp with time zone,
    updated_at           timestamp with time zone,
    last_verified_at     timestamp with time zone,
    verification_source  text,
    verification_status  text,
    id                   uuid DEFAULT gen_random_uuid() NOT NULL,
    museum_id            uuid,
    external_id          text                           NOT NULL,
    medium               text,
    dimensions           text,
    source               text DEFAULT 'museum_api'::text,
    captured_by          uuid,
    local_image_path     text,
    ocr_raw_text         text,
    match_confidence     real,
    capture_latitude     real,
    capture_longitude    real,
    captured_at          timestamp with time zone,
    enriched_from_museum text
);
ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paintings
    ADD CONSTRAINT fk_paintings_museum FOREIGN KEY (museum_id) REFERENCES public.museums (id) ON DELETE RESTRICT;
ALTER TABLE public.paintings
    ADD CONSTRAINT paintings_captured_by_fkey FOREIGN KEY (captured_by) REFERENCES auth.users (id);
ALTER TABLE public.paintings
    ADD CONSTRAINT paintings_pkey PRIMARY KEY (id);
ALTER TABLE public.capture_cluster_members
    ADD CONSTRAINT capture_cluster_members_painting_id_fkey FOREIGN KEY (painting_id) REFERENCES public.paintings (id) ON DELETE CASCADE;
ALTER TABLE public.capture_clusters
    ADD CONSTRAINT capture_clusters_painting_id_fkey FOREIGN KEY (painting_id) REFERENCES public.paintings (id);
ALTER TABLE public.paintings
    ADD CONSTRAINT uq_paintings_museum_external UNIQUE (museum_id, external_id);
GRANT
ALL
ON public.paintings TO anon;
GRANT ALL
ON public.paintings TO authenticated;
GRANT ALL
ON public.paintings TO service_role;
CREATE INDEX idx_paintings_external_id ON public.paintings (external_id);
CREATE INDEX idx_paintings_museum ON public.paintings (museum_id);
CREATE TRIGGER paintings_updated_at
    BEFORE UPDATE
    ON public.paintings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE
POLICY paintings_insert ON public.paintings FOR INSERT TO authenticated WITH CHECK (true);
CREATE
POLICY paintings_owner_insert ON public.paintings FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (source = ANY (ARRAY['camera_capture'::text, 'manual'::text])) AND (captured_by = auth.uid())));
CREATE
POLICY paintings_owner_read ON public.paintings FOR
SELECT USING (((source = ANY (ARRAY['camera_capture'::text, 'manual'::text])) AND (captured_by = auth.uid())));
CREATE
POLICY paintings_owner_update ON public.paintings FOR
UPDATE USING (((captured_by = auth.uid()) AND (source = ANY (ARRAY['camera_capture'::text, 'manual'::text]))));
CREATE
POLICY paintings_public_read ON public.paintings FOR
SELECT USING (((source = ANY (ARRAY['museum_api'::text, 'community_verified'::text])) OR (source IS NULL)));
CREATE
POLICY paintings_select ON public.paintings FOR
SELECT TO authenticated USING (true);
CREATE
POLICY paintings_update ON public.paintings FOR
UPDATE TO authenticated USING (true);
CREATE TABLE public.paintings_backup
(
    id                  text,
    museum_id           text,
    title               text,
    artist              text,
    year                text,
    image_url           text,
    thumbnail_url       text,
    color               text,
    metadata            jsonb,
    cached_at           timestamp with time zone,
    updated_at          timestamp with time zone,
    last_verified_at    timestamp with time zone,
    verification_source text,
    verification_status text
);
ALTER TABLE public.paintings_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.paintings_backup TO anon;
GRANT ALL
ON public.paintings_backup TO authenticated;
GRANT ALL
ON public.paintings_backup TO service_role;
CREATE TABLE public.profiles
(
    id           uuid NOT NULL,
    email        text NOT NULL,
    created_at   timestamp with time zone DEFAULT now(),
    updated_at   timestamp with time zone DEFAULT now(),
    curator_name text,
    avatar_url   text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
GRANT
ALL
ON public.profiles TO anon;
GRANT ALL
ON public.profiles TO authenticated;
GRANT ALL
ON public.profiles TO service_role;
CREATE
POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));
CREATE
POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING ((auth.uid() = id));
CREATE
POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING ((auth.uid() = id));
CREATE TABLE public.profiles_backup
(
    id         uuid,
    email      text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
ALTER TABLE public.profiles_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.profiles_backup TO anon;
GRANT ALL
ON public.profiles_backup TO authenticated;
GRANT ALL
ON public.profiles_backup TO service_role;
CREATE TABLE public.search_cache
(
    id                  uuid                     DEFAULT extensions.uuid_generate_v4() NOT NULL,
    query               text                                                           NOT NULL,
    search_type         text                                                           NOT NULL,
    museum_id           text                                                           NOT NULL,
    painting_ids        text[] NOT NULL,
    last_verified_at    timestamp with time zone DEFAULT now(),
    verification_status text                     DEFAULT 'fresh'::text,
    created_at          timestamp with time zone DEFAULT now(),
    updated_at          timestamp with time zone DEFAULT now()
);
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache
    ADD CONSTRAINT search_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.search_cache
    ADD CONSTRAINT search_cache_query_search_type_museum_id_key UNIQUE (query, search_type, museum_id);
ALTER TABLE public.search_cache
    ADD CONSTRAINT search_cache_search_type_check CHECK (search_type = ANY (ARRAY['artist'::text, 'title'::text]));
GRANT
ALL
ON public.search_cache TO anon;
GRANT ALL
ON public.search_cache TO authenticated;
GRANT ALL
ON public.search_cache TO service_role;
CREATE INDEX idx_search_cache_lookup ON public.search_cache (query, search_type, museum_id);
CREATE INDEX idx_search_cache_verified ON public.search_cache (last_verified_at);
CREATE
POLICY "Anyone can view search_cache" ON public.search_cache FOR
SELECT USING (true);
CREATE
POLICY "Service role can insert search_cache" ON public.search_cache FOR INSERT WITH CHECK (true);
CREATE
POLICY "Service role can update search_cache" ON public.search_cache FOR
UPDATE USING (true);
CREATE TABLE public.search_cache_backup
(
    id                  uuid,
    query               text,
    search_type         text,
    museum_id           text,
    painting_ids        text[],
    last_verified_at    timestamp with time zone,
    verification_status text,
    created_at          timestamp with time zone,
    updated_at          timestamp with time zone
);
ALTER TABLE public.search_cache_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.search_cache_backup TO anon;
GRANT ALL
ON public.search_cache_backup TO authenticated;
GRANT ALL
ON public.search_cache_backup TO service_role;
CREATE TABLE public.search_cache_backup_2
(
    id                  uuid,
    query               text,
    search_type         text,
    museum_id           text,
    painting_ids        text[],
    last_verified_at    timestamp with time zone,
    verification_status text,
    created_at          timestamp with time zone,
    updated_at          timestamp with time zone
);
ALTER TABLE public.search_cache_backup_2 ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.search_cache_backup_2 TO anon;
GRANT ALL
ON public.search_cache_backup_2 TO authenticated;
GRANT ALL
ON public.search_cache_backup_2 TO service_role;
CREATE TABLE public.user_collection
(
    id            uuid                     DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id       uuid                                                           NOT NULL,
    painting_id   uuid                                                           NOT NULL,
    is_seen       boolean                  DEFAULT false                         NOT NULL,
    want_to_visit boolean                  DEFAULT false                         NOT NULL,
    seen_date     timestamp with time zone,
    date_added    timestamp with time zone DEFAULT now()                         NOT NULL,
    notes         text,
    created_at    timestamp with time zone DEFAULT now()                         NOT NULL,
    updated_at    timestamp with time zone DEFAULT now()                         NOT NULL
);
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection
    ADD CONSTRAINT chk_user_collection_status_exclusivity CHECK (NOT (is_seen AND want_to_visit));
ALTER TABLE public.user_collection
    ADD CONSTRAINT uq_user_collection_user_painting UNIQUE (user_id, painting_id);
ALTER TABLE public.user_collection
    ADD CONSTRAINT user_collection_painting_id_fkey FOREIGN KEY (painting_id) REFERENCES public.paintings (id) ON DELETE CASCADE;
ALTER TABLE public.user_collection
    ADD CONSTRAINT user_collection_pkey PRIMARY KEY (id);
ALTER TABLE public.user_collection
    ADD CONSTRAINT user_collection_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
GRANT
ALL
ON public.user_collection TO anon;
GRANT ALL
ON public.user_collection TO authenticated;
GRANT ALL
ON public.user_collection TO service_role;
CREATE INDEX idx_user_collection_user_id ON public.user_collection (user_id);
CREATE INDEX idx_user_collection_painting_id ON public.user_collection (painting_id);
CREATE TRIGGER update_user_collection_updated_at
    BEFORE UPDATE
    ON public.user_collection
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE
POLICY "Users can delete own collection" ON public.user_collection FOR DELETE
USING ((auth.uid() = user_id));
CREATE
POLICY "Users can insert own collection" ON public.user_collection FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE
POLICY "Users can update own collection" ON public.user_collection FOR
UPDATE USING ((auth.uid() = user_id));
CREATE
POLICY "Users can view own collection" ON public.user_collection FOR
SELECT USING ((auth.uid() = user_id));
CREATE TABLE public.user_painting_likes
(
    id          uuid                     DEFAULT gen_random_uuid(),
    user_id     uuid,
    visit_id    uuid,
    liked_at    timestamp with time zone DEFAULT now(),
    painting_id uuid NOT NULL
);
ALTER TABLE public.user_painting_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_painting_likes
    ADD CONSTRAINT fk_likes_painting FOREIGN KEY (painting_id) REFERENCES public.paintings (id) ON DELETE CASCADE;
ALTER TABLE public.user_painting_likes
    ADD CONSTRAINT uq_likes_user_painting UNIQUE (user_id, painting_id);
GRANT
ALL
ON public.user_painting_likes TO anon;
GRANT ALL
ON public.user_painting_likes TO authenticated;
GRANT ALL
ON public.user_painting_likes TO service_role;
CREATE INDEX idx_likes_user ON public.user_painting_likes (user_id);
CREATE INDEX idx_likes_painting ON public.user_painting_likes (painting_id);
CREATE INDEX idx_likes_visit ON public.user_painting_likes (visit_id);
CREATE
POLICY likes_delete ON public.user_painting_likes FOR DELETE
TO authenticated USING ((auth.uid() = user_id));
CREATE
POLICY likes_insert ON public.user_painting_likes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE
POLICY likes_select ON public.user_painting_likes FOR
SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE TABLE public.user_painting_likes_backup
(
    id          uuid,
    user_id     uuid,
    painting_id text,
    visit_id    uuid,
    liked_at    timestamp with time zone
);
ALTER TABLE public.user_painting_likes_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.user_painting_likes_backup TO anon;
GRANT ALL
ON public.user_painting_likes_backup TO authenticated;
GRANT ALL
ON public.user_painting_likes_backup TO service_role;
CREATE TABLE public.user_palette
(
    id           uuid                     DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id      uuid                                                           NOT NULL,
    painting_ids uuid[] NOT NULL,
    created_at   timestamp with time zone DEFAULT now()                         NOT NULL,
    updated_at   timestamp with time zone DEFAULT now()                         NOT NULL
);
ALTER TABLE public.user_palette ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_palette
    ADD CONSTRAINT chk_user_palette_max_size CHECK (array_length(painting_ids, 1) IS NULL OR
                                                    array_length(painting_ids, 1) <= 8);
ALTER TABLE public.user_palette
    ADD CONSTRAINT uq_user_palette_user UNIQUE (user_id);
ALTER TABLE public.user_palette
    ADD CONSTRAINT user_palette_pkey PRIMARY KEY (id);
ALTER TABLE public.user_palette
    ADD CONSTRAINT user_palette_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
GRANT
ALL
ON public.user_palette TO anon;
GRANT ALL
ON public.user_palette TO authenticated;
GRANT ALL
ON public.user_palette TO service_role;
CREATE TRIGGER update_user_palette_updated_at
    BEFORE UPDATE
    ON public.user_palette
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE
POLICY "Users can insert own palette" ON public.user_palette FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE
POLICY "Users can update own palette" ON public.user_palette FOR
UPDATE USING ((auth.uid() = user_id));
CREATE
POLICY "Users can view own palette" ON public.user_palette FOR
SELECT USING ((auth.uid() = user_id));
CREATE TABLE public.visit_palette_paintings
(
    id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
    palette_id  uuid                                               NOT NULL,
    painting_id uuid                                               NOT NULL,
    "position"  integer                                            NOT NULL,
    added_at    timestamp with time zone DEFAULT now()             NOT NULL
);
ALTER TABLE public.visit_palette_paintings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_palette_paintings
    ADD CONSTRAINT visit_palette_paintings_painting_id_fkey FOREIGN KEY (painting_id) REFERENCES public.paintings (id) ON DELETE CASCADE;
ALTER TABLE public.visit_palette_paintings
    ADD CONSTRAINT visit_palette_paintings_palette_id_painting_id_key UNIQUE (palette_id, painting_id);
ALTER TABLE public.visit_palette_paintings
    ADD CONSTRAINT visit_palette_paintings_palette_id_position_key UNIQUE (palette_id, "position");
ALTER TABLE public.visit_palette_paintings
    ADD CONSTRAINT visit_palette_paintings_pkey PRIMARY KEY (id);
ALTER TABLE public.visit_palette_paintings
    ADD CONSTRAINT visit_palette_paintings_position_check CHECK ("position" >= 0 AND "position" < 8);
GRANT
ALL
ON public.visit_palette_paintings TO anon;
GRANT ALL
ON public.visit_palette_paintings TO authenticated;
GRANT ALL
ON public.visit_palette_paintings TO service_role;
CREATE INDEX idx_palette_paintings_palette ON public.visit_palette_paintings (palette_id);
CREATE INDEX idx_palette_paintings_position ON public.visit_palette_paintings (palette_id, "position");
CREATE TABLE public.visit_palettes
(
    id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
    visit_id   uuid                                               NOT NULL,
    created_at timestamp with time zone DEFAULT now()             NOT NULL,
    updated_at timestamp with time zone DEFAULT now()             NOT NULL
);
ALTER TABLE public.visit_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_palettes
    ADD CONSTRAINT visit_palettes_pkey PRIMARY KEY (id);
ALTER TABLE public.visit_palette_paintings
    ADD CONSTRAINT visit_palette_paintings_palette_id_fkey FOREIGN KEY (palette_id) REFERENCES public.visit_palettes (id) ON DELETE CASCADE;
ALTER TABLE public.visit_palettes
    ADD CONSTRAINT visit_palettes_visit_id_key UNIQUE (visit_id);
GRANT
ALL
ON public.visit_palettes TO anon;
GRANT ALL
ON public.visit_palettes TO authenticated;
GRANT ALL
ON public.visit_palettes TO service_role;
CREATE INDEX idx_palettes_visit ON public.visit_palettes (visit_id);
CREATE TRIGGER visit_palettes_updated_at
    BEFORE UPDATE
    ON public.visit_palettes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.visit_palettes_backup
(
    id           uuid,
    visit_id     uuid,
    painting_ids text[],
    created_at   timestamp with time zone,
    updated_at   timestamp with time zone
);
ALTER TABLE public.visit_palettes_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.visit_palettes_backup TO anon;
GRANT ALL
ON public.visit_palettes_backup TO authenticated;
GRANT ALL
ON public.visit_palettes_backup TO service_role;
CREATE TABLE public.visits
(
    id            uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id       uuid,
    visit_date    date,
    notes         text,
    created_at    timestamp with time zone,
    updated_at    timestamp with time zone,
    museum_id     uuid,
    location_name text,
    latitude      real,
    longitude     real
);
CREATE
POLICY palette_paintings_delete ON public.visit_palette_paintings FOR DELETE
TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.visit_palettes vp
     JOIN public.visits v ON ((v.id = vp.visit_id)))
  WHERE ((vp.id = visit_palette_paintings.palette_id) AND (v.user_id = auth.uid())))));
CREATE
POLICY palette_paintings_insert ON public.visit_palette_paintings FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.visit_palettes vp
     JOIN public.visits v ON ((v.id = vp.visit_id)))
  WHERE ((vp.id = visit_palette_paintings.palette_id) AND (v.user_id = auth.uid())))));
CREATE
POLICY palette_paintings_select ON public.visit_palette_paintings FOR
SELECT TO authenticated USING ((EXISTS ( SELECT 1
    FROM (public.visit_palettes vp
    JOIN public.visits v ON ((v.id = vp.visit_id)))
    WHERE ((vp.id = visit_palette_paintings.palette_id) AND (v.user_id = auth.uid())))));
CREATE
POLICY palettes_delete ON public.visit_palettes FOR DELETE
TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.visits v
  WHERE ((v.id = visit_palettes.visit_id) AND (v.user_id = auth.uid())))));
CREATE
POLICY palettes_insert ON public.visit_palettes FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.visits v
  WHERE ((v.id = visit_palettes.visit_id) AND (v.user_id = auth.uid())))));
CREATE
POLICY palettes_select ON public.visit_palettes FOR
SELECT TO authenticated USING ((EXISTS ( SELECT 1
    FROM public.visits v
    WHERE ((v.id = visit_palettes.visit_id) AND (v.user_id = auth.uid())))));
CREATE
POLICY palettes_update ON public.visit_palettes FOR
UPDATE TO authenticated USING ((EXISTS ( SELECT 1
    FROM public.visits v
    WHERE ((v.id = visit_palettes.visit_id) AND (v.user_id = auth.uid())))));
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits
    ADD CONSTRAINT fk_visits_museum FOREIGN KEY (museum_id) REFERENCES public.museums (id) ON DELETE RESTRICT;
ALTER TABLE public.visits
    ADD CONSTRAINT uq_visits_user_location_date UNIQUE (user_id, museum_id, visit_date, location_name);
ALTER TABLE public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);
ALTER TABLE public.user_painting_likes
    ADD CONSTRAINT fk_likes_visit FOREIGN KEY (visit_id) REFERENCES public.visits (id) ON DELETE SET NULL;
ALTER TABLE public.visit_palettes
    ADD CONSTRAINT visit_palettes_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits (id) ON DELETE CASCADE;
GRANT
ALL
ON public.visits TO anon;
GRANT ALL
ON public.visits TO authenticated;
GRANT ALL
ON public.visits TO service_role;
CREATE INDEX idx_visits_date ON public.visits (visit_date DESC);
CREATE INDEX idx_visits_museum ON public.visits (museum_id);
CREATE INDEX idx_visits_user ON public.visits (user_id);
CREATE TRIGGER visits_updated_at
    BEFORE UPDATE
    ON public.visits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE
POLICY visits_delete ON public.visits FOR DELETE
TO authenticated USING ((auth.uid() = user_id));
CREATE
POLICY visits_insert ON public.visits FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE
POLICY visits_select ON public.visits FOR
SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE
POLICY visits_update ON public.visits FOR
UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE TABLE public.visits_backup
(
    id          uuid,
    user_id     uuid,
    museum_id   text,
    museum_name text,
    visit_date  date,
    notes       text,
    created_at  timestamp with time zone,
    updated_at  timestamp with time zone
);
ALTER TABLE public.visits_backup ENABLE ROW LEVEL SECURITY;
GRANT
ALL
ON public.visits_backup TO anon;
GRANT ALL
ON public.visits_backup TO authenticated;
GRANT ALL
ON public.visits_backup TO service_role;
