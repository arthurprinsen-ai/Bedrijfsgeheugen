drop function if exists intern.bg_uitkomst_eenmalig(text,text,text,numeric,text,jsonb);
create or replace function intern.bg_uitkomst_eenmalig(p_bron text, p_bron_id text, p_fase text, p_omzet numeric, p_sleutel text, p_extra jsonb, p_pagina text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v jsonb; v_pagina text;
begin
  if exists (select 1 from public.bg_uitkomst_bronnen_gezien where bron = p_bron and bron_id = p_bron_id) then return; end if;
  v_pagina := case when p_pagina ~ '^/[^?#\s]{0,299}$' then 'https://www.bedrijfsgeheugen.nl' || p_pagina else null end;
  v := public.bg_uitkomst_vastleggen(p_fase, v_pagina, coalesce(p_omzet, 0), p_bron, p_sleutel, null, coalesce(p_extra, '{}'::jsonb), null, null);
  insert into public.bg_uitkomst_bronnen_gezien(bron, bron_id, outcome_id) values (p_bron, p_bron_id, v->>'outcome_id') on conflict do nothing;
end $$;
revoke all on function intern.bg_uitkomst_eenmalig(text,text,text,numeric,text,jsonb,text) from public, anon, authenticated;

create or replace function public.bg_calendly_uitkomst(p_event_id text, p_sessie text, p_extra jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform intern.bg_uitkomst_eenmalig('calendly', p_event_id, 'appointment', 0, coalesce(p_sessie, 'calendly:' || p_event_id), coalesce(p_extra, '{}'::jsonb), p_extra->>'pagina');
end $$;
revoke all on function public.bg_calendly_uitkomst(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.bg_calendly_uitkomst(text,text,jsonb) to service_role;

select cron.schedule('bg-calendly-sync-uurlijks', '20 * * * *', $c$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-calendly-sync', body := '{}'::jsonb, headers := '{"content-type":"application/json"}'::jsonb, timeout_milliseconds := 120000);$c$);
