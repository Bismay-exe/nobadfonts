-- The 'storage' schema is already available in Supabase.
-- We will proceed directly to creating buckets and policies.

-- Create the 'fonts' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('fonts', 'fonts', true)
on conflict (id) do nothing;

-- The 'storage.objects' table usually has RLS enabled by default.
-- We will skip explicitly enabling it to avoid permission errors.

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

-- Create policy to allow public read access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'fonts' );

-- Create policy to allow authenticated users to upload files
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'fonts' );

-- Create policy to allow users to update their own files
create policy "Users can update their own files"
on storage.objects for update
to authenticated
using ( bucket_id = 'fonts' and owner = auth.uid() );

-- Create policy to allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'fonts' and owner = auth.uid() );

-- Ensure font_variants table exists (based on your schema)
create table if not exists public.font_variants (
  id uuid default gen_random_uuid() primary key,
  font_id uuid references public.fonts(id) on delete cascade not null,
  variant_name text not null,
  ttf_url text,
  otf_url text,
  woff_url text,
  woff2_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on font_variants
alter table public.font_variants enable row level security;

-- Policies for font_variants
drop policy if exists "Public read access for variants" on public.font_variants;
drop policy if exists "Authenticated users can insert variants" on public.font_variants;

create policy "Public read access for variants"
  on public.font_variants for select
  using ( true );

create policy "Authenticated users can insert variants"
  on public.font_variants for insert
  to authenticated
  with check ( true );
