-- Commercial learning feedback views: outcome funnel, delivery-to-sales and freshness/contradiction.

create or replace view public.powerhouse_outcome_funnel_v1
with (security_invoker=true) as
select
  coalesce(channel,'unknown') as channel,
  lower(coalesce(outcome_type,'unknown')) as outcome_type,
  count(*) as outcomes,
  coalesce(sum(revenue_eur),0) as realized_revenue_eur,
  count(distinct opportunity_key) filter(where opportunity_key is not null) as opportunities_touched,
  count(distinct company_key) filter(where company_key is not null) as companies_touched,
  min(occurred_at) as first_observed_at,
  max(occurred_at) as last_observed_at
from public.powerhouse_sales_outcomes
group by coalesce(channel,'unknown'),lower(coalesce(outcome_type,'unknown'));

revoke all on public.powerhouse_outcome_funnel_v1 from public, anon, authenticated;
grant select on public.powerhouse_outcome_funnel_v1 to service_role;

create or replace view public.powerhouse_delivery_sales_learning_v1
with (security_invoker=true) as
select
  s.klant_slug,
  s.soort as scan_type,
  s.branche,
  s.omvang,
  round(avg(s.score),2) as avg_scan_score,
  count(distinct s.id) as scans,
  count(distinct q.id) as offers,
  count(distinct q.id) filter(where q.getekend) as won_offers,
  coalesce(sum(q.totaal) filter(where q.getekend),0) as won_offer_value_eur,
  round((count(distinct q.id) filter(where q.getekend))::numeric/nullif(count(distinct q.id),0),4) as observed_offer_win_rate,
  max(greatest(s.aangemaakt,coalesce(q.aangemaakt,s.aangemaakt))) as last_observed_at
from public.scan_inzendingen s
left join public.offerte_inzendingen q on lower(trim(q.klant_slug))=lower(trim(s.klant_slug))
group by s.klant_slug,s.soort,s.branche,s.omvang;

revoke all on public.powerhouse_delivery_sales_learning_v1 from public, anon, authenticated;
grant select on public.powerhouse_delivery_sales_learning_v1 to service_role;

create or replace view public.powerhouse_freshness_contradiction_v1
with (security_invoker=true) as
select
  o.opportunity_key,o.company_key,o.person_key,o.topic_key,
  o.probability,o.confidence,o.last_evidence_at,o.updated_at,
  ci.last_relevant_at as company_last_relevant_at,
  pi.last_relevant_at as person_last_relevant_at,
  greatest(
    coalesce(o.last_evidence_at,'epoch'::timestamptz),
    coalesce(ci.last_relevant_at,'epoch'::timestamptz),
    coalesce(pi.last_relevant_at,'epoch'::timestamptz)
  ) as freshest_evidence_at,
  extract(epoch from (now()-greatest(
    coalesce(o.last_evidence_at,'epoch'::timestamptz),
    coalesce(ci.last_relevant_at,'epoch'::timestamptz),
    coalesce(pi.last_relevant_at,'epoch'::timestamptz)
  )))/86400.0 as evidence_age_days,
  case
    when greatest(coalesce(o.last_evidence_at,'epoch'::timestamptz),coalesce(ci.last_relevant_at,'epoch'::timestamptz),coalesce(pi.last_relevant_at,'epoch'::timestamptz)) >= now()-interval '7 days' then 'fresh'
    when greatest(coalesce(o.last_evidence_at,'epoch'::timestamptz),coalesce(ci.last_relevant_at,'epoch'::timestamptz),coalesce(pi.last_relevant_at,'epoch'::timestamptz)) >= now()-interval '30 days' then 'aging'
    else 'stale'
  end as freshness_state,
  ((coalesce(o.probability,0)>=0.70 and coalesce(ci.company_intent_score,0)<0.20)
    or (coalesce(o.confidence,0)>=0.70 and greatest(coalesce(o.last_evidence_at,'epoch'::timestamptz),coalesce(ci.last_relevant_at,'epoch'::timestamptz),coalesce(pi.last_relevant_at,'epoch'::timestamptz)) < now()-interval '30 days')) as contradiction_detected,
  coalesce(ci.company_intent_score,0) as company_intent_score
from public.powerhouse_opportunities o
left join public.powerhouse_company_intelligence_v1 ci on ci.company_key=o.company_key
left join public.powerhouse_person_intelligence_v1 pi on pi.person_key=o.person_key
where o.status='open';

revoke all on public.powerhouse_freshness_contradiction_v1 from public, anon, authenticated;
grant select on public.powerhouse_freshness_contradiction_v1 to service_role;

create or replace view public.powerhouse_commercial_control_room_v1
with (security_invoker=true) as
select
  m.*,
  (select count(*) from public.powerhouse_freshness_contradiction_v1 where freshness_state='stale') as stale_opportunities,
  (select count(*) from public.powerhouse_freshness_contradiction_v1 where contradiction_detected) as contradictory_opportunities,
  (select count(*) from public.powerhouse_delivery_sales_learning_v1 where offers>0) as delivery_segments_with_offer_evidence,
  (select count(*) from public.powerhouse_outcome_funnel_v1) as observed_outcome_funnel_segments,
  (select count(*) from public.powerhouse_champion_challenger_v1 where challenger_fingerprint is not null) as active_champion_challenger_pairs
from public.powerhouse_commercial_maturity_v1 m;

revoke all on public.powerhouse_commercial_control_room_v1 from public, anon, authenticated;
grant select on public.powerhouse_commercial_control_room_v1 to service_role;
