-- 1. Create a debug log table to verify trigger execution
CREATE TABLE IF NOT EXISTS public.trigger_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_time timestamp DEFAULT now(),
  message text,
  details jsonb
);

-- Allow everyone to read logs for debugging (remove in prod)
ALTER TABLE public.trigger_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read logs" ON public.trigger_logs;
CREATE POLICY "Public read logs" ON public.trigger_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write logs" ON public.trigger_logs;
CREATE POLICY "Service write logs" ON public.trigger_logs FOR INSERT WITH CHECK (true);

-- 2. Explicitly Grant Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.trigger_logs TO postgres, anon, authenticated, service_role;

-- 3. Robust Trigger Function with Logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_val text;
BEGIN
  -- Log start
  INSERT INTO public.trigger_logs (message, details)
  VALUES ('Trigger started', row_to_json(new));

  -- Generate username
  username_val := public.generate_username(COALESCE(new.raw_user_meta_data->>'full_name', 'user'), new.id);

  -- Log generated username
  INSERT INTO public.trigger_logs (message, details)
  VALUES ('Generated username', jsonb_build_object('username', username_val));

  -- Perform Insert
  INSERT INTO public.profiles (id, full_name, role, avatar_url, email, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email, 'User'),
    'user',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    username_val
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    username = COALESCE(public.profiles.username, EXCLUDED.username);

  -- Log success
  INSERT INTO public.trigger_logs (message) VALUES ('Profile inserted successfully');

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO public.trigger_logs (message, details)
  VALUES ('Error in trigger', jsonb_build_object('error', SQLERRM));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
