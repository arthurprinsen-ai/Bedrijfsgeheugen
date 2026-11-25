
create index if not exists powerhouse_sales_outcomes_person_occurred_idx
  on public.powerhouse_sales_outcomes(person_key, occurred_at desc)
  where person_key is not null;

create or replace view public.powerhouse_person_intelligence_v1
with (security_invoker=true)
as
with contacts as (
  select
    c.*,
    coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as canonical_person_key,
    lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) as company_key_normalized
  from public.bg_connecties c
  where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
),
aliases as (
  select canonical_person_key, canonical_person_key as alias_key
  from contacts
  union
  select canonical_person_key, linkedin_url as alias_key
  from contacts
  where nullif(trim(linkedin_url),'') is not null
),
event_stats as (
  select
    a.canonical_person_key as person_key,
    count(*) filter(where e.occurred_at>=now()-interval '30 days')::int as events_30d,
    max(e.occurred_at) as last_observed_at,
    array_remove(array_agg(distinct e.topic_key),null::text) as observed_topics
  from aliases a
  join public.powerhouse_runtime_events e
    on e.person_key=a.alias_key
   and e.occurred_at>=now()-interval '180 days'
  group by a.canonical_person_key
),
action_stats as (
  select
    a.canonical_person_key as person_key,
    count(*) filter(where s.executed_at>=now()-interval '30 days')::int as actions_30d,
    count(*) filter(where s.executed_at>=now()-interval '90 days')::int as actions_90d,
    max(s.executed_at) as last_action_at
  from aliases a
  join public.powerhouse_sales_actions s on s.person_key=a.alias_key
  group by a.canonical_person_key
),
outcome_stats as (
  select
    a.canonical_person_key as person_key,
    count(*)::int as outcomes_total,
    count(*) filter(where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|order|revenue)')::int as positive_outcomes,
    count(*) filter(where lower(o.outcome_type) ~ '(meeting|appointment)')::int as meetings,
    count(*) filter(where lower(o.outcome_type) ~ '(proposal|offerte)')::int as proposals,
    count(*) filter(where lower(o.outcome_type) ~ '(won|order|revenue)')::int as won_outcomes,
    coalesce(sum(o.revenue_eur),0::numeric) as realized_revenue_eur,
    max(o.occurred_at) as last_outcome_at
  from aliases a
  join public.powerhouse_sales_outcomes o on o.person_key=a.alias_key
  group by a.canonical_person_key
),
opp_stats as (
  select
    a.canonical_person_key as person_key,
    count(*) filter(where coalesce(o.status,'') <> all(array['closed','won','lost']))::int as open_opportunities,
    max(coalesce(o.probability,0::numeric)*coalesce(o.confidence,0::numeric)) as max_opportunity_signal,
    max(o.last_evidence_at) as last_opportunity_evidence_at
  from aliases a
  join public.powerhouse_opportunities o on o.person_key=a.alias_key
  group by a.canonical_person_key
)
select
  c.canonical_person_key as person_key,
  c.linkedin_url,
  c.naam as person_name,
  c.bedrijf as company_name,
  c.company_key_normalized,
  c.rol as role,
  c.segment,
  c.status as relationship_status,
  c.prioriteit,
  c.email,
  c.telefoon,
  c.whatsapp_toegestaan,
  c.aanleiding,
  array_remove(array[
    case when nullif(trim(c.linkedin_url),'') is not null then 'linkedin'::text end,
    case when nullif(trim(c.email),'') is not null then 'email'::text end,
    case when nullif(trim(c.telefoon),'') is not null and c.whatsapp_toegestaan is true then 'whatsapp'::text end
  ],null::text) as available_channels,
  coalesce(e.events_30d,0) as events_30d,
  coalesce(s.actions_30d,0) as actions_30d,
  coalesce(s.actions_90d,0) as actions_90d,
  coalesce(o.outcomes_total,0) as outcomes_total,
  coalesce(o.positive_outcomes,0) as positive_outcomes,
  coalesce(o.meetings,0) as meetings,
  coalesce(o.proposals,0) as proposals,
  coalesce(o.won_outcomes,0) as won_outcomes,
  coalesce(o.realized_revenue_eur,0::numeric) as realized_revenue_eur,
  coalesce(op.open_opportunities,0) as open_opportunities,
  e.observed_topics,
  greatest(e.last_observed_at,s.last_action_at,o.last_outcome_at,op.last_opportunity_evidence_at,c.bijgewerkt_op) as last_relevant_at,
  round(least(1::numeric,greatest(0::numeric,
    0.10 +
    case
      when c.status='klant' then 0.55
      when c.status='in_gesprek' then 0.32
      when c.status='aangeboden' then 0.10
      else 0
    end +
    least(0.18,coalesce(e.events_30d,0)::numeric*0.025) +
    least(0.20,coalesce(o.positive_outcomes,0)::numeric*0.06) +
    least(0.12,coalesce(op.max_opportunity_signal,0::numeric)*0.12) -
    least(0.16,coalesce(s.actions_30d,0)::numeric*0.025)
  )),4) as relationship_warmth,
  round(case
    when coalesce(c.rol,'') ~* '(ceo|chief executive|eigenaar|owner|founder|oprichter|directeur|managing director)' then 1.00
    when coalesce(c.rol,'') ~* '(cfo|coo|cto|cio|cdo|chief|vp|vice president|head of|partner)' then 0.88
    when coalesce(c.rol,'') ~* '(manager|lead|principal|director)' then 0.68
    else 0.42
  end,4) as decision_influence,
  jsonb_build_object(
    'source','bg_connecties+powerhouse_runtime_events+sales_lineage',
    'aanleiding',c.aanleiding,
    'laatste_uitkomst',c.laatste_uitkomst,
    'observed_topics',coalesce(to_jsonb(e.observed_topics),'[]'::jsonb),
    'last_observed_at',e.last_observed_at,
    'last_action_at',s.last_action_at,
    'last_outcome_at',o.last_outcome_at,
    'open_opportunities',coalesce(op.open_opportunities,0)
  ) as person_context
from contacts c
left join event_stats e on e.person_key=c.canonical_person_key
left join action_stats s on s.person_key=c.canonical_person_key
left join outcome_stats o on o.person_key=c.canonical_person_key
left join opp_stats op on op.person_key=c.canonical_person_key;
