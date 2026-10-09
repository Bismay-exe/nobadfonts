-- NoBadFonts font-processing atomic publishing schema.
-- Review the destination project before running this script in Supabase SQL Editor.
-- This creates the audit ledger and RPCs; it does not publish fonts or upload Storage objects.

DO $preflight$
DECLARE missing_columns text;
BEGIN
  IF to_regclass('public.fonts') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: public.fonts does not exist';
  END IF;
  IF to_regclass('public.font_variants') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: public.font_variants does not exist';
  END IF;

  SELECT string_agg(required.column_name, ', ' ORDER BY required.column_name)
    INTO missing_columns
  FROM (VALUES
    ('id'), ('font_id'), ('variant_name'), ('ttf_url'), ('otf_url'),
    ('woff_url'), ('woff2_url'), ('file_size_ttf'), ('file_size_otf'),
    ('file_size_woff'), ('file_size_woff2'), ('created_at')
  ) AS required(column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'font_variants'
      AND c.column_name = required.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Preflight failed: public.font_variants is missing required columns: %', missing_columns;
  END IF;
END;
$preflight$;

create table if not exists public.font_processing_publish_batches(
 batch_id text primary key,idempotency_key text not null unique,manifest_sha256 text,
 status text not null default 'validating' check(status in('validating','staging','ready_to_publish','publishing','committed','failed','reconciliation_required')),
 asset_count integer not null default 0 check(asset_count>=0),row_count integer not null default 0 check(row_count>=0),
 staged_keys jsonb not null default '[]'::jsonb check(jsonb_typeof(staged_keys)='array'),
 phase text,last_error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.font_processing_publish_batches enable row level security;
revoke all on public.font_processing_publish_batches from public,anon,authenticated;
grant select,insert,update on public.font_processing_publish_batches to service_role;
create or replace function public.record_font_processing_batch_state(p_batch_id text,p_status text,p_idempotency_key text,p_asset_count integer default 0,p_row_count integer default 0,p_staged_keys jsonb default '[]'::jsonb,p_phase text default null,p_error text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare current_status text;
begin
 if p_batch_id is null or p_batch_id !~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$' or p_batch_id like '%..%' then raise exception 'invalid batch id';end if;
 if p_idempotency_key is distinct from ('font-processing:'||p_batch_id) then raise exception 'invalid idempotency key';end if;
 if p_status not in('validating','staging','ready_to_publish','publishing','committed','failed','reconciliation_required') then raise exception 'invalid batch status';end if;
 if p_asset_count<0 or p_row_count<0 or jsonb_typeof(coalesce(p_staged_keys,'[]'::jsonb))<>'array' then raise exception 'invalid batch counters or staged keys';end if;
 insert into public.font_processing_publish_batches(batch_id,idempotency_key,status,asset_count,row_count,staged_keys,phase,last_error) values(p_batch_id,p_idempotency_key,p_status,p_asset_count,p_row_count,coalesce(p_staged_keys,'[]'::jsonb),p_phase,left(p_error,2000)) on conflict(batch_id) do nothing;
 select status into current_status from public.font_processing_publish_batches where batch_id=p_batch_id and idempotency_key=p_idempotency_key for update;
 if not found then raise exception 'batch idempotency key mismatch';end if;
 if current_status='committed' then return jsonb_build_object('batch_id',p_batch_id,'status','committed','terminal',true);end if;
 update public.font_processing_publish_batches set status=p_status,asset_count=p_asset_count,row_count=p_row_count,staged_keys=coalesce(p_staged_keys,'[]'::jsonb),phase=p_phase,last_error=left(p_error,2000),updated_at=now() where batch_id=p_batch_id and idempotency_key=p_idempotency_key;
 return jsonb_build_object('batch_id',p_batch_id,'status',p_status);
end;$$;
create or replace function public.publish_font_processing_batch(p_batch_id text,p_idempotency_key text,p_manifest_sha256 text,p_rows jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare item jsonb; fid uuid; vname text; fmt text; skey text; purl text; sz bigint; vid uuid; st text; mh text; ik text; cnt integer:=0; prefix text;
begin
 if p_batch_id is null or p_batch_id !~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$' or p_batch_id like '%..%' then raise exception 'invalid batch id';end if;
 if p_idempotency_key is distinct from ('font-processing:'||p_batch_id) then raise exception 'invalid idempotency key';end if;
 if p_manifest_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'invalid manifest hash';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)=0 then raise exception 'rows must be non-empty';end if;
 prefix:='staging/font-processing/'||p_batch_id||'/';
 insert into public.font_processing_publish_batches(batch_id,idempotency_key,manifest_sha256,status,row_count) values(p_batch_id,p_idempotency_key,p_manifest_sha256,'publishing',jsonb_array_length(p_rows)) on conflict(batch_id) do nothing;
 select status,manifest_sha256,idempotency_key into st,mh,ik from public.font_processing_publish_batches where batch_id=p_batch_id for update;
 if not found or ik is distinct from p_idempotency_key then raise exception 'batch idempotency key mismatch';end if;
 if mh is not null and mh<>p_manifest_sha256 then raise exception 'batch reused with different manifest';end if;
 if st='committed' then return jsonb_build_object('committed',true,'idempotent_replay',true);end if;
 update public.font_processing_publish_batches set manifest_sha256=p_manifest_sha256,status='publishing',row_count=jsonb_array_length(p_rows),updated_at=now() where batch_id=p_batch_id;
 for item in select value from jsonb_array_elements(p_rows) loop
  fid:=(item->>'font_id')::uuid;vname:=btrim(item->>'variant_name');fmt:=lower(item->>'format');skey:=item->>'staging_key';purl:=item->>'public_url';sz:=(item->>'size_bytes')::bigint;
  if vname is null or vname='' then raise exception 'variant name required';end if;
  if fmt not in('ttf','otf','woff','woff2') then raise exception 'unsupported font format: %',fmt;end if;
  if skey is null or left(skey,length(prefix))<>prefix or position('..' in skey)>0 then raise exception 'staging key outside batch';end if;
  if purl is null or position('/storage/v1/object/public/fonts/'||skey in purl)=0 then raise exception 'public URL does not match staged key';end if;
  if sz is null or sz<=0 then raise exception 'invalid size';end if;
  if not exists(select 1 from public.fonts where id=fid) then raise exception 'font not found';end if;
  perform pg_advisory_xact_lock(hashtextextended(fid::text||':'||lower(vname),0));
  select id into vid from public.font_variants where font_id=fid and lower(variant_name)=lower(vname) order by created_at nulls first,id limit 1 for update;
  if vid is null then insert into public.font_variants(font_id,variant_name) values(fid,vname) returning id into vid;end if;
  if fmt='ttf' then update public.font_variants set ttf_url=purl,file_size_ttf=sz where id=vid;
  elsif fmt='otf' then update public.font_variants set otf_url=purl,file_size_otf=sz where id=vid;
  elsif fmt='woff' then update public.font_variants set woff_url=purl,file_size_woff=sz where id=vid;
  else update public.font_variants set woff2_url=purl,file_size_woff2=sz where id=vid;end if;
  cnt:=cnt+1;vid:=null;
 end loop;
 update public.font_processing_publish_batches set status='committed',manifest_sha256=p_manifest_sha256,row_count=cnt,last_error=null,phase=null,updated_at=now() where batch_id=p_batch_id;
 return jsonb_build_object('committed',true,'idempotent_replay',false,'row_count',cnt);
end;$$;
revoke all on function public.record_font_processing_batch_state(text,text,text,integer,integer,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.publish_font_processing_batch(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_font_processing_batch_state(text,text,text,integer,integer,jsonb,text,text) to service_role;
grant execute on function public.publish_font_processing_batch(text,text,text,jsonb) to service_role;
