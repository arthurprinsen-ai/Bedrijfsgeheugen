-- 1. Merkteken voor robotverkeer
alter table public.growth_events add column if not exists is_robot boolean not null default false;
create index if not exists growth_events_occurred_at_idx on public.growth_events (occurred_at);
create index if not exists growth_events_is_robot_idx on public.growth_events (is_robot);

-- 2. Bestaand verkeer terugwerkend beoordelen: meer dan 30 signalen in één minuut is geen mens
with drukke_minuten as (
  select date_trunc('minute', occurred_at) as m
  from public.growth_events group by 1 having count(*) > 30
)
update public.growth_events e
set is_robot = true
where date_trunc('minute', e.occurred_at) in (select m from drukke_minuten)
  and e.event_type = 'page_view';

-- 3. Die signalen uit de wachtrij halen, zodat het brein er straks niet van leert
update public.growth_brain_queue q
set state = 'BLOCKED', last_error = 'robotverkeer', updated_at = now()
where q.kind = 'event'
  and q.state = 'QUEUED'
  and exists (select 1 from public.growth_events e where e.event_id = q.source_id and e.is_robot);

-- 4. Dagcijfers per pagina herrekenen zonder robots
update public.growth_page_daily d
set page_views = coalesce((
      select count(*) from public.growth_events e
      where e.occurred_at::date = d.day
        and e.canonical = d.canonical
        and coalesce(e.intent_owner,'') = d.intent_owner
        and e.event_type = 'page_view'
        and not e.is_robot), 0),
    updated_at = now();

-- 5. Nieuw binnenkomend verkeer meteen beoordelen
create or replace function public.bg_growth_ingest_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_event_id text := nullif(trim(p_event->>'event_id'),'');
  v_event_type text := nullif(trim(p_event->>'event_type'),'');
  v_canonical text := nullif(trim(p_event->>'canonical'),'');
  v_intent_owner text := coalesce(nullif(trim(p_event->>'intent_owner'),''),'');
  v_occurred timestamptz := coalesce(nullif(p_event->>'occurred_at','')::timestamptz, now());
  v_inserted integer := 0;
  v_fingerprint text;
  v_robot boolean := false;
  v_tempo integer := 0;
begin
  if v_event_id is null or v_event_type is null then raise exception 'INVALID_GROWTH_EVENT'; end if;
  if v_canonical is not null and not (v_canonical='https://www.bedrijfsgeheugen.nl/' or v_canonical like 'https://www.bedrijfsgeheugen.nl/%') then raise exception 'INVALID_CANONICAL'; end if;

  -- Tempotoets: meer dan 30 weergaven in de voorafgaande minuut is geen menselijk bezoek
  if v_event_type = 'page_view' then
    select count(*) into v_tempo from public.growth_events
    where event_type = 'page_view'
      and occurred_at > v_occurred - interval '1 minute'
      and occurred_at <= v_occurred;
    v_robot := v_tempo > 30;
  end if;

  v_fingerprint := coalesce(nullif(p_event->>'fingerprint',''),'growth-event|'||v_event_id);

  insert into public.growth_events(event_id,event_type,canonical,intent,intent_owner,attribution_root_key,source,medium,campaign,occurred_at,page_role,funnel_stage,value,payload,is_robot)
  values(v_event_id,v_event_type,v_canonical,nullif(p_event->>'intent',''),nullif(p_event->>'intent_owner',''),nullif(p_event->>'attribution_root_key',''),nullif(p_event->>'source',''),nullif(p_event->>'medium',''),nullif(p_event->>'campaign',''),v_occurred,nullif(p_event->>'page_role',''),nullif(p_event->>'funnel_stage',''),coalesce((p_event->>'value')::numeric,0),coalesce(p_event->'payload','{}'::jsonb),v_robot)
  on conflict(event_id) do nothing;
  get diagnostics v_inserted = row_count;

  insert into public.growth_brain_queue(queue_id,kind,source_id,fingerprint,state,last_error)
  values('event:'||v_event_id,'event',v_event_id,v_fingerprint,
         case when v_robot then 'BLOCKED' else 'QUEUED' end,
         case when v_robot then 'robotverkeer' else null end)
  on conflict(kind,source_id) do nothing;

  if v_inserted=1 and v_canonical is not null and not v_robot then
    insert into public.growth_page_daily(day,canonical,intent_owner,page_views,cta_clicks)
    values(v_occurred::date,v_canonical,v_intent_owner,case when v_event_type='page_view' then 1 else 0 end,case when v_event_type in ('cta_click','selfscan_start','frisse_blik_click') then 1 else 0 end)
    on conflict(day,canonical,intent_owner) do update set
      page_views=public.growth_page_daily.page_views+excluded.page_views,
      cta_clicks=public.growth_page_daily.cta_clicks+excluded.cta_clicks,
      updated_at=now();
  end if;

  return jsonb_build_object('stored',v_inserted=1,'deduped',v_inserted=0,'robot',v_robot,'event_id',v_event_id,'queue_id','event:'||v_event_id);
end;
$function$;

-- 6. Uitkomst vastleggen loopt nu via de bestaande ingest, zodat de dagcijfers meebewegen
create or replace function public.bg_uitkomst_vastleggen(
  p_fase text,
  p_pagina text default null,
  p_omzet_eur numeric default 0,
  p_bron text default 'handmatig',
  p_attributiesleutel text default null,
  p_eigenaar text default null,
  p_extra jsonb default '{}'::jsonb
) returns text language plpgsql set search_path = public as $$
declare
  v_id text := gen_random_uuid()::text;
  v_root text := coalesce(p_attributiesleutel, p_pagina, p_bron);
begin
  perform public.bg_growth_ingest_outcome(jsonb_build_object(
    'outcome_id', v_id,
    'stage', p_fase,
    'attribution_root_key', v_root,
    'canonical', p_pagina,
    'intent_owner', p_eigenaar,
    'revenue_eur', coalesce(p_omzet_eur,0),
    'source', p_bron,
    'payload', coalesce(p_extra,'{}'::jsonb)
  ));
  return v_id;
end;
$$;

-- 7. Views tellen voortaan alleen mensen
create or replace view public.bg_machine_status as
select 1 as stap, 'Signalen binnen (mens)'::text as onderdeel,
       (select count(*) from public.growth_events where not is_robot)::numeric as aantal,
       'robotverkeer telt niet mee'::text as toelichting
union all
select 2, 'Geweigerd als robot', (select count(*) from public.growth_events where is_robot)::numeric, 'meer dan 30 weergaven in één minuut'
union all
select 3, 'Wacht in de wachtrij', (select count(*) from public.growth_brain_queue where state='QUEUED')::numeric, 'klaar om af te leveren aan het brein'
union all
select 4, 'Afgeleverd aan het brein', (select count(*) from public.growth_brain_queue where state='DELIVERED')::numeric, 'daadwerkelijk verwerkt'
union all
select 5, 'Uitkomsten vastgelegd', (select count(*) from public.growth_outcomes)::numeric, 'lead, afspraak, voorstel, opdracht of omzet'
union all
select 6, 'Omzet toegekend (euro)', (select coalesce(sum(revenue_eur),0) from public.growth_outcomes)::numeric, 'euro gekoppeld aan een actie'
union all
select 7, 'Lessen getrokken', (select count(*) from public.revenue_learnings)::numeric, 'conclusies uit uitkomsten'
union all
select 8, 'Lessen toegepast', (select count(*) from public.revenue_learning_applications)::numeric, 'les die het werk veranderde'
order by 1;

create or replace view public.bg_paginarendement as
select coalesce(e.canonical, o.canonical) as pagina,
       coalesce(e.weergaven,0) as weergaven, coalesce(e.interacties,0) as interacties,
       coalesce(o.uitkomsten,0) as uitkomsten, coalesce(o.omzet,0) as omzet_eur
from (
  select canonical,
         count(*) filter (where event_type='page_view') as weergaven,
         count(*) filter (where event_type<>'page_view') as interacties
  from public.growth_events where not is_robot group by canonical
) e
full outer join (
  select canonical, count(*) as uitkomsten, coalesce(sum(revenue_eur),0) as omzet
  from public.growth_outcomes group by canonical
) o on o.canonical = e.canonical;

create or replace view public.bg_trechter_dag as
select dag, fase, signalen, uitkomsten, omzet_eur from (
  select occurred_at::date as dag, funnel_stage as fase, count(*) as signalen, 0::bigint as uitkomsten, 0::numeric as omzet_eur
  from public.growth_events where not is_robot group by 1,2
  union all
  select occurred_at::date, stage, 0, count(*), coalesce(sum(revenue_eur),0)
  from public.growth_outcomes group by 1,2
) x order by dag desc, fase;
