\set ON_ERROR_STOP on

-- Isolated schema fixture for the font family hierarchy migration.
create table public.fonts (
  id uuid primary key,
  woff2_url text not null,
  zip_url text not null
);

insert into public.fonts (id, woff2_url, zip_url)
values ('00000000-0000-0000-0000-000000000001', 'https://example.test/regular.woff2', 'https://example.test/regular.zip');

\ir ../supabase/migrations/20261010000001_font_family_hierarchy.sql

DO $$
DECLARE
  existing_role text;
  existing_woff2 text;
  existing_zip text;
BEGIN
  SELECT family_role, woff2_url, zip_url
    INTO existing_role, existing_woff2, existing_zip
    FROM public.fonts
    WHERE id = '00000000-0000-0000-0000-000000000001';

  IF existing_role <> 'standalone' THEN
    RAISE EXCEPTION 'Existing rows must default to standalone';
  END IF;
  IF existing_woff2 <> 'https://example.test/regular.woff2'
    OR existing_zip <> 'https://example.test/regular.zip' THEN
    RAISE EXCEPTION 'Existing asset URLs must remain unchanged';
  END IF;
END;
$$;

insert into public.fonts (id, woff2_url, zip_url, family_role)
values ('00000000-0000-0000-0000-000000000002', null, null, 'parent');

insert into public.fonts (id, woff2_url, zip_url, family_role, parent_font_id)
values (
  '00000000-0000-0000-0000-000000000003',
  'https://example.test/neon.woff2',
  'https://example.test/neon.zip',
  'subfamily',
  '00000000-0000-0000-0000-000000000002'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO public.fonts (id, woff2_url, zip_url, family_role, parent_font_id)
    VALUES (
      '00000000-0000-0000-0000-000000000004',
      null, null, 'subfamily',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'expected subfamily parent-role validation to fail';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'expected subfamily parent-role validation to fail' THEN
      RAISE;
    END IF;
  END;
END;
$$;

DO $$
BEGIN
  BEGIN
    UPDATE public.fonts
      SET family_role = 'standalone'
      WHERE id = '00000000-0000-0000-0000-000000000002';
    RAISE EXCEPTION 'expected parent-role protection to fail';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'expected parent-role protection to fail' THEN
      RAISE;
    END IF;
  END;
END;
$$;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.fonts WHERE parent_font_id = '00000000-0000-0000-0000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'Expected one child record for the parent family';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fonts
    WHERE id = '00000000-0000-0000-0000-000000000002'
      AND family_role = 'parent'
      AND woff2_url IS NULL
      AND zip_url IS NULL
  ) THEN
    RAISE EXCEPTION 'Parent family record should not require font binary URLs';
  END IF;
END;
$$;
