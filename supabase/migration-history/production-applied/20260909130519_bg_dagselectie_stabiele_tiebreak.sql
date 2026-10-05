create or replace function public.bg_connecties_dagselectie(p_aantal integer default 20)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_token text; r record; v_aantal integer := 0;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets
  where name='bg_connecties_ingest_token' order by created_at desc limit 1;
  if v_token is null then raise exception 'TOKEN_ONTBREEKT'; end if;

  for r in
    select c.*, s.score
    from public.bg_connecties c
    join public.bg_connectiescore s on s.linkedin_url = c.linkedin_url
    where c.status = 'nieuw'
      and (c.laatst_aangeboden_op is null or c.laatst_aangeboden_op < now() - interval '60 days')
      and not exists (select 1 from public.powerhouse_sales_actions a
                      where a.subject_key = c.linkedin_url and a.status in ('suggested','done'))
    -- gelijke scores: eerst wie een e-mailadres heeft, daarna een vaste spreiding
    -- over de hele lijst in plaats van alfabetisch of op invoervolgorde
    order by s.score desc, (c.email is not null) desc, md5(c.linkedin_url)
    limit greatest(1, least(p_aantal, 100))
  loop
    perform net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-runtime/ingest',
      headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
      body := jsonb_build_object('event', jsonb_build_object(
        'event_type','connection_activated','source','bg-connecties',
        'profileUrl', r.linkedin_url,'subject_key', r.linkedin_url,'person_key', r.linkedin_url,
        'personName', r.naam,'company', r.bedrijf,'company_key', r.bedrijf,'role', r.rol,
        'email', r.email,'phone', r.telefoon,'whatsappAllowed', coalesce(r.whatsapp_toegestaan,false),
        'reason', coalesce(r.aanleiding, coalesce(r.naam,'Deze relatie') || ' staat als commerciële activatiekans open.'),
        'priority', r.score,'topic_key', coalesce(r.segment,'connectie-activatie'),
        'dataQuality','OBSERVED','confidence',0.6)));

    update public.bg_connecties set status='aangeboden', laatst_aangeboden_op=now(), bijgewerkt_op=now()
    where linkedin_url = r.linkedin_url;
    v_aantal := v_aantal + 1;
  end loop;

  return jsonb_build_object('aangeboden', v_aantal, 'op', now());
end;
$$;
