-- 0. Ensure username column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- 1. Improved Username Generation Function
CREATE OR REPLACE FUNCTION public.generate_username(name text, user_id uuid) 
RETURNS text AS $$
DECLARE
  clean_name text;
BEGIN
  -- Handle null or empty name by defaulting to 'user'
  IF name IS NULL OR name = '' THEN
    clean_name := 'user';
  ELSE
    -- Remove non-alphanumeric characters and convert to lowercase
    clean_name := lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'));
    -- If the name becomes empty after cleaning (e.g. if it was just symbols), fallback to 'user'
    IF clean_name = '' THEN
      clean_name := 'user';
    END IF;
  END IF;

  -- Return name + short UUID suffix
  RETURN clean_name || '-' || substring(user_id::text, 1, 4);
END;
$$ LANGUAGE plpgsql;

-- 2. Robust Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url, email, username)
  VALUES (
    new.id,
    -- Default to email or 'User' if full_name is missing
    COALESCE(new.raw_user_meta_data->>'full_name', new.email, 'User'),
    -- Default role
    'member',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    -- Generate username using the robust function
    public.generate_username(COALESCE(new.raw_user_meta_data->>'full_name', 'user'), new.id)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER is crucial!

-- 3. Ensure the Trigger Exists
-- First, drop it to be safe (in case it's broken)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate it
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Retroactive Fix (Optional but helpful)
-- Attempt to create profiles for users who exist in auth.users but not in public.profiles
INSERT INTO public.profiles (id, full_name, role, email, username)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'), 
  'member', 
  email,
  public.generate_username(COALESCE(raw_user_meta_data->>'full_name', 'user'), id)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
