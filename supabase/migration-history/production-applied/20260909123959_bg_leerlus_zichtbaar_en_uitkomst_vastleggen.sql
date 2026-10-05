-- 1. Waar staat de machine: één regel per stap in de lus
create or replace view public.bg_machine_status as
select 1 as stap, 'Signalen binnen'::text as onderdeel,
       (select count(*) from public.growth_events)::numeric as aantal,
       'ruwe gebeurtenissen van de site'::text as toelichting
union all
select 2, 'Wacht in de wachtrij',
       (select count(*) from public.growth_brain_queue where state = 'QUEUED')::numeric,
       'nog niet bij het brein afgeleverd'
union all
select 3, 'Afgeleverd aan het brein',
       (select count(*) from public.growth_brain_queue where state = 'DELIVERED')::numeric,
       'daadwerkelijk verwerkt'
union all
select 4, 'Uitkomsten vastgelegd',
       (select count(*) from public.growth_outcomes)::numeric,
       'lead, afspraak, voorstel, opdracht of omzet'
union all
select 5, 'Omzet toegekend (euro)',
       (select coalesce(sum(revenue_eur), 0) from public.growth_outcomes)::numeric,
       'euro gekoppeld aan een actie'
union all
select 6, 'Lessen getrokken',
       (select count(*) from public.revenue_learnings)::numeric,
       'conclusies uit uitkomsten'
union all
select 7, 'Lessen toegepast',
       (select count(*) from public.revenue_learning_applications)::numeric,
       'les die het werk daadwerkelijk veranderde'
order by 1;

-- 2. Rendement per pagina: signalen tegenover uitkomsten en euro's
create or replace view public.bg_paginarendement as
select coalesce(e.canonical, o.canonical) as pagina,
       coalesce(e.weergaven, 0) as weergaven,
       coalesce(e.interacties, 0) as interacties,
       coalesce(o.uitkomsten, 0) as uitkomsten,
       coalesce(o.omzet, 0) as omzet_eur
from (
  select canonical,
         count(*) filter (where event_type = 'page_view') as weergaven,
         count(*) filter (where event_type <> 'page_view') as interacties
  from public.growth_events group by canonical
) e
full outer join (
  select canonical, count(*) as uitkomsten, coalesce(sum(revenue_eur), 0) as omzet
  from public.growth_outcomes group by canonical
) o on o.canonical = e.canonical;

-- 3. Trechter per dag
create or replace view public.bg_trechter_dag as
select dag, funnel_stage as fase, signalen, uitkomsten, omzet_eur from (
  select occurred_at::date as dag, funnel_stage, count(*) as signalen,
         0::bigint as uitkomsten, 0::numeric as omzet_eur
  from public.growth_events group by 1, 2
  union all
  select occurred_at::date, stage, 0, count(*), coalesce(sum(revenue_eur), 0)
  from public.growth_outcomes group by 1, 2
) x order by dag desc, fase;

-- 4. Verkeer dat vermoedelijk geen mens is
create or replace view public.bg_verkeer_verdacht as
select occurred_at::date as dag, canonical as pagina,
       count(*) filter (where event_type = 'page_view') as weergaven,
       count(*) filter (where event_type <> 'page_view') as interacties,
       case when count(*) filter (where event_type = 'page_view') >= 20
             and count(*) filter (where event_type <> 'page_view') = 0
            then 'vermoedelijk robot' else 'mens mogelijk' end as oordeel
from public.growth_events group by 1, 2;

-- 5. De ontbrekende schrijfweg: uitkomst mét euro's vastleggen, zonder Make
create or replace function public.bg_uitkomst_vastleggen(
  p_fase text,
  p_pagina text default null,
  p_omzet_eur numeric default 0,
  p_bron text default 'handmatig',
  p_attributiesleutel text default null,
  p_eigenaar text default null,
  p_extra jsonb default '{}'::jsonb
) returns text
language plpgsql
set search_path = public
as $$
declare
  v_id text := gen_random_uuid()::text;
begin
  if p_fase not in ('lead','qualified_lead','appointment','proposal','won_order','revenue') then
    raise exception 'Onbekende fase %. Kies uit lead, qualified_lead, appointment, proposal, won_order, revenue.', p_fase;
  end if;

  insert into public.growth_outcomes
    (outcome_id, stage, attribution_root_key, canonical, intent_owner, occurred_at, revenue_eur, source, payload, created_at)
  values
    (v_id, p_fase, coalesce(p_attributiesleutel, p_pagina), p_pagina, p_eigenaar, now(),
     coalesce(p_omzet_eur, 0), p_bron, coalesce(p_extra, '{}'::jsonb), now());

  insert into public.growth_brain_queue (queue_id, kind, source_id, fingerprint, state, attempts, created_at, updated_at)
  values (gen_random_uuid()::text, 'outcome', v_id, md5(p_fase || coalesce(p_pagina, '') || v_id), 'QUEUED', 0, now(), now())
  on conflict (kind, source_id) do nothing;

  return v_id;
end;
$$;

grant select on public.bg_machine_status, public.bg_paginarendement,
                public.bg_trechter_dag, public.bg_verkeer_verdacht to authenticated, service_role;
grant execute on function public.bg_uitkomst_vastleggen(text, text, numeric, text, text, text, jsonb)
  to authenticated, service_role;
