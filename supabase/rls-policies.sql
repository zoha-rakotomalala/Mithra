-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VISITS
-- ============================================================

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visits" ON visits;
DROP POLICY IF EXISTS "Users can insert own visits" ON visits;
DROP POLICY IF EXISTS "Users can update own visits" ON visits;
DROP POLICY IF EXISTS "Users can delete own visits" ON visits;

CREATE POLICY "Users can view own visits"
  ON visits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON visits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits"
  ON visits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits"
  ON visits
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- PAINTINGS (CACHED, GLOBAL READ)
-- ============================================================

ALTER TABLE paintings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view paintings" ON paintings;
DROP POLICY IF EXISTS "Service role can insert paintings" ON paintings;
DROP POLICY IF EXISTS "Service role can update paintings" ON paintings;

CREATE POLICY "Anyone can view paintings"
  ON paintings
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert paintings"
  ON paintings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update paintings"
  ON paintings
  FOR UPDATE
  USING (true);

-- ============================================================
-- USER PAINTING LIKES
-- ============================================================

ALTER TABLE user_painting_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own likes" ON user_painting_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON user_painting_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON user_painting_likes;

CREATE POLICY "Users can view own likes"
  ON user_painting_likes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes"
  ON user_painting_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON user_painting_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- VISIT PALETTES
-- ============================================================

ALTER TABLE visit_palettes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visit palettes" ON visit_palettes;
DROP POLICY IF EXISTS "Users can insert own visit palettes" ON visit_palettes;
DROP POLICY IF EXISTS "Users can update own visit palettes" ON visit_palettes;

CREATE POLICY "Users can view own visit palettes"
  ON visit_palettes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM visits
      WHERE visits.id = visit_palettes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own visit palettes"
  ON visit_palettes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM visits
      WHERE visits.id = visit_palettes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own visit palettes"
  ON visit_palettes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM visits
      WHERE visits.id = visit_palettes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

-- ============================================================
-- CANON PALETTES
-- ============================================================

ALTER TABLE canon_palettes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own canon palette" ON canon_palettes;
DROP POLICY IF EXISTS "Users can insert own canon palette" ON canon_palettes;
DROP POLICY IF EXISTS "Users can update own canon palette" ON canon_palettes;

CREATE POLICY "Users can view own canon palette"
  ON canon_palettes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canon palette"
  ON canon_palettes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canon palette"
  ON canon_palettes
  FOR UPDATE
  USING (auth.uid() = user_id);

ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view search_cache" ON search_cache;
DROP POLICY IF EXISTS "Service role can insert search_cache" ON search_cache;
DROP POLICY IF EXISTS "Service role can update search_cache" ON search_cache;

CREATE POLICY "Anyone can view search_cache"
  ON search_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert search_cache"
  ON search_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update search_cache"
  ON search_cache
  FOR UPDATE
  USING (true);