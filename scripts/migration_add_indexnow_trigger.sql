
-- Function to trigger IndexNow Edge Function
create or replace function public.handle_indexnow_submission()
returns trigger as $$
declare
  request_id bigint;
begin
  -- Only trigger if published is true AND (it's a new insert OR published changed to true OR slug changed)
  if new.is_published = true and (
     TG_OP = 'INSERT' or 
     old.is_published = false or 
     old.slug is distinct from new.slug
  ) then
    select net.http_post(
      url := 'https://wcegdxhvgwbeskaidlxr.supabase.co/functions/v1/submit-indexnow',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'record', row_to_json(new),
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'type', TG_OP
      )
    ) into request_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists on_font_publish_indexnow on public.fonts;
create trigger on_font_publish_indexnow
after insert or update on public.fonts
for each row
execute function public.handle_indexnow_submission();
