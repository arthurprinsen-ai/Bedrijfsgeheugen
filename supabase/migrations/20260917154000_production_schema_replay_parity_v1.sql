-- Canonical replay baseline for production schema that predates/escaped migration history.
-- Production is already in this state; this migration is intentionally idempotent there.
-- Fresh DR replay must converge without copying business data.

create table if not exists public.bg_buffer_ingest_status (
  organisatie_id text primary key,
  laatst_opgehaald timestamptz,
  tot_posts integer not null default 0,
  tot_metingen integer not null default 0
);

create table if not exists public.bg_buffer_sync (
  run_id text primary key,
  afgelopen_uur timestamptz not null,
  posts_opgehaald integer not null default 0,
  posts_bijgewerkt integer not null default 0,
  metingen_ingevuld integer not null default 0,
  status text not null default 'ok',
  fout text,
  uitgevoerd_op timestamptz not null default now()
);

create table if not exists public.bg_ga4_sync (
  run_id text primary key,
  afgelopen_uur timestamptz not null,
  pages_opgehaald integer not null default 0,
  pages_bijgewerkt integer not null default 0,
  metingen_ingevuld integer not null default 0,
  status text not null default 'ok',
  fout text,
  uitgevoerd_op timestamptz not null default now()
);

create table if not exists public.bg_integrations (
  integration text primary key,
  token text not null,
  organisatie_id text,
  status text not null default 'actief',
  bijgewerkt_op timestamptz not null default now()
);

create table if not exists public.bg_notion_sync (
  run_id text primary key,
  wat text not null,
  records_gesyncet integer not null default 0,
  status text not null default 'ok',
  fout text,
  uitgevoerd_op timestamptz not null default now()
);

create table if not exists public.bg_notion_webhooks (
  webhook_id text primary key,
  notion_database_id text,
  event_type text,
  last_fired timestamptz,
  status text default 'active'
);

create table if not exists public.bg_tasks (
  task_id text primary key default (gen_random_uuid())::text,
  titel text,
  type text,
  status text default 'todo',
  duedate timestamptz,
  priority text,
  notitie text,
  created_at timestamptz default now()
);

alter table public.bg_buffer_ingest_status enable row level security;
alter table public.bg_buffer_sync enable row level security;
alter table public.bg_ga4_sync enable row level security;
alter table public.bg_integrations enable row level security;
alter table public.bg_notion_sync enable row level security;
alter table public.bg_notion_webhooks enable row level security;
alter table public.bg_tasks enable row level security;

revoke all on table public.bg_buffer_ingest_status from public, anon, authenticated;
revoke all on table public.bg_buffer_sync from public, anon, authenticated;
revoke all on table public.bg_ga4_sync from public, anon, authenticated;
revoke all on table public.bg_integrations from public, anon, authenticated;
revoke all on table public.bg_notion_sync from public, anon, authenticated;
revoke all on table public.bg_notion_webhooks from public, anon, authenticated;
revoke all on table public.bg_tasks from public, anon, authenticated;

grant all on table public.bg_buffer_ingest_status to service_role;
grant all on table public.bg_buffer_sync to service_role;
grant all on table public.bg_ga4_sync to service_role;
grant all on table public.bg_integrations to service_role;
grant all on table public.bg_notion_sync to service_role;
grant all on table public.bg_notion_webhooks to service_role;
grant all on table public.bg_tasks to service_role;

create or replace function public.bg_actualiseer_connecties_via_lessen()
returns void
language plpgsql
set search_path to 'public', 'pg_catalog'
as $function$
begin
  update bg_connecties set
    prioriteit = least(100, prioriteit + 5),
    bijgewerkt_op = now()
  where status in ('in_gesprek', 'rust')
    and exists(select 1 from bg_schrijfregels where status='actief');
end;
$function$;

grant execute on function public.bg_actualiseer_connecties_via_lessen() to public, anon, authenticated, service_role;

create or replace function public.bg_brein_regels_check(
  p_connectie_id text,
  p_tekst text,
  p_haaktype text default null::text
)
returns table(regel_id text, violation boolean, feedback text)
language plpgsql
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_haaktype text := coalesce(p_haaktype, 'onbekend');
begin
  if p_tekst like '%mening%' or p_tekst like '%wat denk je%' then
    return query select 'slotvraag'::text, true::boolean,
      'Slotvraag vraagt naar mening. Vraag in plaats daarvan om een concreet voorbeeld uit hun eigen week.'::text;
  end if;

  if p_tekst not like '%bedrijfsgeheugen.nl%' and p_tekst not like '%/g/%' then
    return query select 'doorklik'::text, true::boolean,
      'Post mist meetbare link naar bedrijfsgeheugen.nl. Zet een link in met /g/:sleutel.'::text;
  end if;

  if v_haaktype = 'onbekend' then
    return query select 'haaktype'::text, true::boolean,
      'Haaktype niet ingevuld. Vul hook_type in de Notion-kalender in voor betere feedback.'::text;
  end if;

  return query select null::text, false::boolean, null::text where false;
end;
$function$;

grant execute on function public.bg_brein_regels_check(text,text,text) to public, anon, authenticated, service_role;

create or replace function intern.bg_meetcijfers(p_dagen integer default 30)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_ok boolean;
  v_van timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_dagen, 30), 365)));
  v jsonb;
begin
  with m as (
    select * from public.bg_interacties
    where not is_robot and coalesce(gebeurd_op, ontvangen_op) >= v_van
  ),
  bezoek as (select pad, count(distinct sessie) bezoeken, count(*) weergaven from m where gebeurtenis = 'pagina' group by pad),
  tijd as (select pad, percentile_cont(0.5) within group (order by seconden) mediaan_sec from m where gebeurtenis = 'tijd_op_pagina' and seconden is not null group by pad),
  scr as (select pad, diepte_pct, count(distinct sessie) sessies from m where gebeurtenis = 'scroll' group by pad, diepte_pct),
  kl as (select pad, count(*) kliks from m where gebeurtenis = 'klik' group by pad),
  volgorde as (select sessie, pad, row_number() over (partition by sessie order by coalesce(gebeurd_op, ontvangen_op) desc) rn from m where gebeurtenis = 'pagina' and sessie is not null),
  vertrek as (select pad, count(*) vertrekken from volgorde where rn = 1 group by pad),
  paginas as (
    select b.pad, b.bezoeken, b.weergaven, round(t.mediaan_sec::numeric) mediaan_sec, coalesce(k.kliks, 0) kliks,
      coalesce(v.vertrekken, 0) vertrekken,
      round(100.0 * coalesce(v.vertrekken, 0) / nullif(b.bezoeken, 0)) vertrek_pct,
      (select jsonb_object_agg(d::text, round(100.0 * coalesce((select s.sessies from scr s where s.pad = b.pad and s.diepte_pct = d), 0) / nullif(b.bezoeken, 0)))
         from unnest(array[25, 50, 75, 90, 100]) d) scroll_pct
    from bezoek b left join tijd t using (pad) left join kl k using (pad) left join vertrek v using (pad)
  ),
  knoppen as (
    select m.pad, coalesce(m.element_tekst, '(zonder tekst)') tekst, m.onderdeel, m.element_doel doel, count(*) kliks, count(distinct m.sessie) sessies,
      round(100.0 * count(distinct m.sessie) / nullif(max(b.bezoeken), 0)) pct_bezoekers
    from m left join bezoek b using (pad)
    where m.gebeurtenis = 'klik' group by 1, 2, 3, 4
  ),
  formulieren as (
    select pad, coalesce(element_tekst, 'formulier') formulier,
      count(distinct sessie) filter (where gebeurtenis = 'formulier_start') gestart,
      count(distinct sessie) filter (where gebeurtenis = 'formulier_verzonden') verzonden
    from m where gebeurtenis in ('formulier_start', 'formulier_verzonden') group by 1, 2
  )
  select jsonb_build_object(
    'periode_dagen', greatest(1, least(coalesce(p_dagen, 30), 365)),
    'gegenereerd_op', now(),
    'totaal', jsonb_build_object(
      'bezoekers', (select count(distinct sessie) from m),
      'paginaweergaven', (select count(*) from m where gebeurtenis = 'pagina'),
      'kliks', (select count(*) from m where gebeurtenis = 'klik'),
      'formulieren_gestart', (select count(distinct sessie) from m where gebeurtenis = 'formulier_start'),
      'formulieren_verzonden', (select count(distinct sessie) from m where gebeurtenis = 'formulier_verzonden'),
      'robots_uitgefilterd', (select count(*) from public.bg_interacties where is_robot and coalesce(gebeurd_op, ontvangen_op) >= v_van),
      'apparaten', (select coalesce(jsonb_object_agg(apparaat, n), '{}'::jsonb) from (select apparaat, count(distinct sessie) n from m where apparaat is not null group by 1) a),
      'bronnen', (select coalesce(jsonb_agg(jsonb_build_object('bron', bron, 'bezoekers', n) order by n desc), '[]'::jsonb) from (select coalesce(nullif(bron_domein, ''), '(direct)') bron, count(distinct sessie) n from m group by 1 order by 2 desc limit 10) b),
      'toestemming_pct', (select round(100.0 * count(distinct sessie) filter (where toestemming) / nullif(count(distinct sessie), 0)) from m)
    ),
    'paginas', coalesce((select jsonb_agg(to_jsonb(p) order by p.bezoeken desc) from paginas p), '[]'::jsonb),
    'knoppen', coalesce((select jsonb_agg(to_jsonb(k) order by k.kliks desc) from (select * from knoppen order by kliks desc limit 300) k), '[]'::jsonb),
    'formulieren', coalesce((select jsonb_agg(jsonb_build_object('pad', f.pad, 'formulier', f.formulier, 'gestart', f.gestart, 'verzonden', f.verzonden,
        'gestrand', greatest(f.gestart - f.verzonden, 0), 'gestrand_pct', round(100.0 * greatest(f.gestart - f.verzonden, 0) / nullif(f.gestart, 0))) order by f.gestart desc) from formulieren f), '[]'::jsonb)
  ) into v;
  return v;
end
$function$;

revoke all on function intern.bg_meetcijfers(integer) from public, anon, authenticated, service_role;

create or replace function private.offerte_akkoord(p_offerte uuid, p_naam text, p_functie text default null::text)
returns table(offerte uuid, stand text, getekend_op timestamp with time zone)
language plpgsql
security definer
set search_path to ''
as $function$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v public.offertes%rowtype;
  v_org public.organisaties%rowtype;
  v_naam text := nullif(btrim(coalesce(p_naam, '')), '');
  v_functie text := nullif(btrim(coalesce(p_functie, '')), '');
begin
  if v_uid is null then
    raise exception 'Niet ingelogd.' using errcode = '42501';
  end if;

  select o.* into v from public.offertes o where o.id = p_offerte for update;
  if not found or not exists (
    select 1 from public.leden l
     where l.gebruiker_id = v_uid and l.organisatie_id = v.organisatie_id
  ) then
    raise exception 'Offerte niet gevonden.' using errcode = 'P0002';
  end if;

  if v.status = 'geaccepteerd' then
    return query select v.id, v.status, v.akkoord_op;
    return;
  end if;
  if v.status <> 'verstuurd' then
    raise exception 'Deze offerte kan niet worden getekend (status: %).', v.status using errcode = '22023';
  end if;
  if v.geldig_tot is not null and v.geldig_tot < (now() at time zone 'Europe/Amsterdam')::date then
    raise exception 'Deze offerte is verlopen op %.', v.geldig_tot using errcode = '22023';
  end if;
  if v_naam is null or length(v_naam) < 3 then
    raise exception 'Vul je naam in.' using errcode = '22023';
  end if;

  update public.offertes o
     set status = 'geaccepteerd',
         akkoord_op = now(),
         akkoord_door = v_uid,
         akkoord_naam = v_naam,
         akkoord_functie = v_functie
   where o.id = v.id;

  insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
  values (v.organisatie_id, v.id, v_uid, 'offerte_getekend',
          jsonb_build_object('nummer', v.nummer, 'bedrag', v.bedrag, 'naam', v_naam, 'functie', v_functie));

  begin
    select g.* into v_org from public.organisaties g where g.id = v.organisatie_id;
    insert into public.powerhouse_sales_actions
      (dedupe_key, subject_key, company_key, action_type, channel, priority, reason, evidence,
       message_draft, source_url, status, due_at, person_name, company_name, role, expected_value_eur)
    values
      ('offerte_getekend:' || v.id::text,
       'offerte:' || v.id::text,
       v_org.slug,
       'offerte_getekend',
       'Telefoon',
       1000,
       format('Offerte %s is getekend door %s op %s. Bel om de start in te plannen.',
              coalesce(v.nummer, ''), v_naam,
              to_char(now() at time zone 'Europe/Amsterdam', 'DD-MM-YYYY HH24:MI')),
       jsonb_build_object('offerte_id', v.id, 'nummer', v.nummer, 'bedrag', v.bedrag,
                          'naam', v_naam, 'functie', v_functie, 'organisatie', v_org.naam),
       format(E'Hoi %s,\\n\\nDank je voor je akkoord op %s. Ik bel je deze week om de start in te plannen. Welk moment komt je het best uit?',
              split_part(v_naam, ' ', 1), coalesce(v.nummer, 'de offerte')),
       'https://www.bedrijfsgeheugen.nl/klantportaal?klant=' || coalesce(v_org.slug, ''),
       'suggested',
       now(),
       v_naam,
       v_org.naam,
       v_functie,
       coalesce(v.bedrag, 0))
    on conflict (dedupe_key) do nothing;
  exception when others then
    insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
    values (v.organisatie_id, v.id, v_uid, 'melding_mislukt',
            jsonb_build_object('waar', 'powerhouse_sales_actions', 'fout', sqlerrm));
  end;

  return query select v.id, 'geaccepteerd'::text, now();
end;
$function$;

revoke all on function private.offerte_akkoord(uuid,text,text) from public, anon;
grant execute on function private.offerte_akkoord(uuid,text,text) to authenticated, service_role;

create or replace function public.offerte_akkoord(p_offerte uuid, p_naam text, p_functie text default null::text)
returns table(offerte uuid, stand text, getekend_op timestamp with time zone)
language sql
set search_path to ''
as $function$
  select * from private.offerte_akkoord(p_offerte, p_naam, p_functie);
$function$;

revoke all on function public.offerte_akkoord(uuid,text,text) from public, anon;
grant execute on function public.offerte_akkoord(uuid,text,text) to authenticated, service_role;

-- Fresh replay still carried an obsolete overload that production no longer has.
drop function if exists public.bg_uitkomst_vastleggen(text,text,numeric,text,text,text,jsonb);
