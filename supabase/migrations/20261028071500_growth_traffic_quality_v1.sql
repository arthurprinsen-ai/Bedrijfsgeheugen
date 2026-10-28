-- Traffic quality for growth events: separates verified human visitors from bots and unverified single views.
-- Read-only views over public.growth_events. No data is changed.

create or replace view public.powerhouse_growth_traffic_quality_v1
with (security_invoker = true) as
with roots as (
  select
    attribution_root_key as root_key,
    min(occurred_at) as first_seen,
    max(occurred_at) as last_seen,
    count(*) filter (where event_type = 'page_view') as page_views,
    count(*) filter (where event_type in (
      'engaged_view', 'primary_cta_click', 'secondary_cta_click', 'money_link_click',
      'selfscan_start', 'frisse_blik_start', 'scan_completed'
    )) as actions,
    count(distinct canonical) as pages,
    bool_or(coalesce(is_robot, false)) as flagged_robot
  from public.growth_events
  where attribution_root_key is not null
  group by attribution_root_key
)
select
  root_key,
  first_seen,
  last_seen,
  page_views,
  actions,
  pages,
  flagged_robot,
  case
    when flagged_robot then 'robot_flagged'
    when actions > 0 then 'verified_human'
    when page_views >= 8 then 'probable_bot'
    else 'unverified'
  end as traffic_class
from roots;

comment on view public.powerhouse_growth_traffic_quality_v1 is
  'Per attribution root: verified_human (at least one engaged view, CTA click or scan), robot_flagged (any event flagged), probable_bot (8 or more page views without action), else unverified. Classification is a measurement aid, not proof of identity.';

create or replace view public.powerhouse_growth_traffic_quality_daily_v1
with (security_invoker = true) as
select
  date_trunc('day', first_seen)::date as day,
  traffic_class,
  count(*) as roots,
  sum(page_views) as page_views,
  sum(actions) as actions
from public.powerhouse_growth_traffic_quality_v1
group by 1, 2;

revoke all on public.powerhouse_growth_traffic_quality_v1 from public, anon, authenticated;
revoke all on public.powerhouse_growth_traffic_quality_daily_v1 from public, anon, authenticated;
grant select on public.powerhouse_growth_traffic_quality_v1 to service_role;
grant select on public.powerhouse_growth_traffic_quality_daily_v1 to service_role;
