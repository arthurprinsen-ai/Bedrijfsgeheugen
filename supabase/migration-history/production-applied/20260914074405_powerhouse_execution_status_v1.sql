create or replace function public.powerhouse_execution_status(p_run_date date default current_date)
returns jsonb
language sql
stable
as $$
with d as (
  select count(*)::int as decision_count,
         count(*) filter (where decision='publish')::int as publish_count,
         count(*) filter (where decision='publish' and state in ('scheduled','published','measured','learned'))::int as delivered_publish_count,
         count(*) filter (where decision='publish' and state not in ('scheduled','published','measured','learned'))::int as unresolved_publish_count
  from public.powerhouse_channel_decisions where run_date=p_run_date
), s as (
  select count(*)::int as published_social_count from public.social_posts
  where (published_at at time zone 'Europe/Amsterdam')::date=p_run_date
)
select jsonb_build_object('run_date',p_run_date,'decision_count',d.decision_count,'publish_count',d.publish_count,'delivered_publish_count',d.delivered_publish_count,'unresolved_publish_count',d.unresolved_publish_count,'published_social_count',s.published_social_count,'all_channels_decided',d.decision_count=7,'execution_complete',d.decision_count=7 and d.unresolved_publish_count=0)
from d cross join s;
$$;
