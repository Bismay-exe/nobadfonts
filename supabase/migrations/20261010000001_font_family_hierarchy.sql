-- Font family hierarchy for parent families and named subfamilies.
-- This migration changes schema only; it does not create or publish font records.
begin;

alter table public.fonts
  add column if not exists parent_font_id uuid,
  add column if not exists family_role text not null default 'standalone';

alter table public.fonts
  drop constraint if exists fonts_parent_font_id_fkey,
  add constraint fonts_parent_font_id_fkey
    foreign key (parent_font_id) references public.fonts(id) on delete restrict;

alter table public.fonts
  drop constraint if exists fonts_family_role_check,
  add constraint fonts_family_role_check
    check (family_role in ('standalone', 'parent', 'subfamily'));

alter table public.fonts
  drop constraint if exists fonts_family_parent_role_check,
  add constraint fonts_family_parent_role_check
    check (
      (family_role = 'subfamily' and parent_font_id is not null)
      or (family_role in ('standalone', 'parent') and parent_font_id is null)
    );

alter table public.fonts
  drop constraint if exists fonts_parent_not_self_check,
  add constraint fonts_parent_not_self_check
    check (parent_font_id is null or parent_font_id <> id);

-- Parent-family records are organizational records and do not require a single
-- primary font binary or ZIP. Existing font records keep their current values.
alter table public.fonts
  alter column woff2_url drop not null,
  alter column zip_url drop not null;

create index if not exists fonts_parent_font_id_idx
  on public.fonts(parent_font_id)
  where parent_font_id is not null;

create or replace function public.enforce_font_family_hierarchy()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_role text;
begin
  if new.family_role = 'subfamily' then
    if new.parent_font_id is null then
      raise exception 'A subfamily must reference a parent family';
    end if;

    select family_role into parent_role
      from public.fonts
      where id = new.parent_font_id
      for key share;

    if parent_role is distinct from 'parent' then
      raise exception 'parent_font_id must reference a font with family_role=parent';
    end if;
  elsif new.parent_font_id is not null then
    raise exception 'Only subfamilies may set parent_font_id';
  end if;

  if tg_op = 'UPDATE' then
    if old.family_role = 'parent' and new.family_role <> 'parent'
      and exists (select 1 from public.fonts child where child.parent_font_id = old.id) then
      raise exception 'A parent family with subfamilies cannot change its family_role';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists fonts_enforce_family_hierarchy on public.fonts;
create trigger fonts_enforce_family_hierarchy
before insert or update of family_role, parent_font_id on public.fonts
for each row execute function public.enforce_font_family_hierarchy();

comment on column public.fonts.parent_font_id is
  'Parent family record for a named subfamily; null for standalone and parent records.';
comment on column public.fonts.family_role is
  'Whether this record is standalone, a parent family, or a named subfamily.';

commit;
