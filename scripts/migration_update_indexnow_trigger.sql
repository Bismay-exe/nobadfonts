
-- Function to trigger IndexNow Edge Function
create or replace function public.handle_indexnow_submission()
returns trigger as $$
declare
  request_id bigint;
  payload jsonb;
begin
  -- Determine payload based on operation
  if (TG_OP = 'DELETE' and old.is_published = true) then
      payload := jsonb_build_object(
        'record', row_to_json(old),
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'type', TG_OP
      );
  elsif (TG_OP = 'INSERT' and new.is_published = true) or 
        (TG_OP = 'UPDATE' and new.is_published = true and (old.is_published = false or old.slug is distinct from new.slug)) then
      payload := jsonb_build_object(
        'record', row_to_json(new),
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'type', TG_OP
      );
  else
      -- No action needed
      return null;
  end if;

  -- Send request
  select net.http_post(
      url := 'https://wcegdxhvgwbeskaidlxr.supabase.co/functions/v1/submit-indexnow',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
  ) into request_id;

  if (TG_OP = 'DELETE') then
      return old;
  else
      return new;
  end if;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists on_font_publish_indexnow on public.fonts;
create trigger on_font_publish_indexnow
after insert or update or delete on public.fonts
for each row
execute function public.handle_indexnow_submission();
