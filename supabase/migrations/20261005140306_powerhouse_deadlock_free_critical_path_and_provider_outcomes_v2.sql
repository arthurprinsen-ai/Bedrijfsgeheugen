create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare
  v_now timestamptz:=now(); v_snapshot_at timestamptz; v_rows int:=0; v_age interval;
begin
  select max(refreshed_at),count(*)::int into v_snapshot_at,v_rows
  from public.powerhouse_revenue_command_center_snapshot_v1;
  v_age := case when v_snapshot_at is null then null else v_now-v_snapshot_at end;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,
    'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v5',
    'company-person-commercial',
    v_now,
    jsonb_build_object(
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',v_snapshot_at,
      'snapshot_rows',v_rows,
      'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end
    ),
    jsonb_build_object(
      'critical_path_mode','read_only_snapshot',
      'heavy_intelligence_refresh_inline',false,
      'reason','prevent lock contention/deadlocks with asynchronous research/composer/provider writebacks',
      'existing_refresh_owners_preserved',true,
      'single_action_materializer',true
    ),
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 'actioned' else 'degraded' end,
    case when v_snapshot_at is not null and v_rows>0 then 'VERIFIED' else 'INCOMPLETE' end,
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 1 else .4 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v5',
    'healthy',v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0,
    'source_nba','v5',
    'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,
    'snapshot_rows',v_rows,
    'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $$;

create or replace function public.powerhouse_provider_ack_outcome_v1()
returns trigger language plpgsql set search_path='public','pg_catalog' as $$
declare v_ack boolean:=false;
begin
  if new.status='done' and new.executed_at is not null
     and (old.status is distinct from new.status or old.executed_at is distinct from new.executed_at) then
    v_ack :=
      coalesce((new.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)
      or coalesce((new.evidence#>>'{salesrobot_execution,provider_ack_verified}')::boolean,false)
      or coalesce((new.evidence->>'provider_ack_verified')::boolean,false);

    if v_ack and not exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=new.action_id) then
      insert into public.powerhouse_sales_outcomes(
        action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence,occurred_at,
        content_key,topic_key,campaign_key,opportunity_key,channel
      ) values(
        new.action_id,'provider-ack:'||new.action_id::text,'provider_ack',
        new.subject_key,new.person_key,new.company_key,0,
        jsonb_build_object(
          'contract','powerhouse-provider-ack-outcome-v1',
          'truth_class','provider_acknowledged_execution',
          'provider_ack_verified',true,
          'message_hash',coalesce(new.evidence#>>'{commercial_intelligence,message_hash}',new.evidence->>'sent_message_hash'),
          'message_strategy',new.evidence#>>'{commercial_intelligence,message_strategy}',
          'learning_key',new.evidence#>>'{commercial_intelligence,learning_key}'
        ),
        new.executed_at,new.content_key,new.topic_key,new.campaign_key,new.opportunity_key,new.channel
      )
      on conflict(dedupe_key) do nothing;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_powerhouse_provider_ack_outcome_v1 on public.powerhouse_sales_actions;
create trigger trg_powerhouse_provider_ack_outcome_v1
after update of status,executed_at,evidence on public.powerhouse_sales_actions
for each row execute function public.powerhouse_provider_ack_outcome_v1();

insert into public.powerhouse_sales_outcomes(
  action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence,occurred_at,
  content_key,topic_key,campaign_key,opportunity_key,channel
)
select
  a.action_id,'provider-ack:'||a.action_id::text,'provider_ack',
  a.subject_key,a.person_key,a.company_key,0,
  jsonb_build_object(
    'contract','powerhouse-provider-ack-outcome-v1',
    'truth_class','provider_acknowledged_execution',
    'provider_ack_verified',true,
    'historical_backfill',true,
    'message_hash',coalesce(a.evidence#>>'{commercial_intelligence,message_hash}',a.evidence->>'sent_message_hash'),
    'message_strategy',a.evidence#>>'{commercial_intelligence,message_strategy}',
    'learning_key',a.evidence#>>'{commercial_intelligence,learning_key}'
  ),
  a.executed_at,a.content_key,a.topic_key,a.campaign_key,a.opportunity_key,a.channel
from public.powerhouse_sales_actions a
where a.status='done' and a.executed_at is not null
  and (
    coalesce(a.evidence#>>'{autonomous_outbound,provider_ack_verified}','false')='true'
    or coalesce(a.evidence#>>'{salesrobot_execution,provider_ack_verified}','false')='true'
    or coalesce(a.evidence->>'provider_ack_verified','false')='true'
  )
  and not exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)
on conflict(dedupe_key) do nothing;

create or replace view public.powerhouse_one_commercial_loop_health_v1 with(security_invoker=true) as
select
 now() measured_at,
 count(*) filter(where a.created_at>=now()-interval '30 days') actions_30d,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days') executed_30d,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days'
   and (coalesce(a.evidence#>>'{autonomous_outbound,provider_ack_verified}','false')='true'
     or coalesce(a.evidence#>>'{salesrobot_execution,provider_ack_verified}','false')='true'
     or coalesce(a.evidence->>'provider_ack_verified','false')='true')) provider_ack_30d,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days'
   and exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)) terminal_outcome_linked_30d,
 count(*) filter(where a.status in ('suggested','prepared','waiting')
   and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>'') pending_strategy_labeled,
 count(*) filter(where a.status in ('suggested','prepared','waiting')
   and coalesce(a.message_draft,'')<>''
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id)) pending_quality_ready,
 count(*) filter(where a.status in ('suggested','prepared','waiting')
   and coalesce(a.evidence#>>'{commercial_intelligence,source_nba}','')='powerhouse_commercial_next_best_action_v5') pending_from_nba_v5,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days'
   and (coalesce(a.evidence#>>'{autonomous_outbound,provider_ack_verified}','false')='true'
     or coalesce(a.evidence#>>'{salesrobot_execution,provider_ack_verified}','false')='true'
     or coalesce(a.evidence->>'provider_ack_verified','false')='true')
   and exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)) provider_ack_outcome_linked_30d
from public.powerhouse_sales_actions a;
