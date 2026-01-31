-- Add username column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Function to generate a slug from a name
CREATE OR REPLACE FUNCTION generate_username(name text, user_id uuid) 
RETURNS text AS $$
BEGIN
    RETURN lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g')) || '-' || substring(user_id::text, 1, 4);
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles that don't have a username
UPDATE profiles 
SET username = generate_username(full_name, id)
WHERE username IS NULL;

-- Make username not null after population (optional, but good practice)
-- ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;

-- We also need to update the trigger that creates profiles to generate a username
-- Assuming there is a trigger 'on_auth_user_created' calling a function 'handle_new_user'
-- We will replace the function to include username generation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url, email, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'member',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    generate_username(new.raw_user_meta_data->>'full_name', new.id)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
