-- Delta on top of the canonical Human Commercial Orchestrator v1.
-- Adds exact-copy outbound gating and outcome/revenue learning; does not create a second orchestrator.

create or replace function public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select case
    when a.action_id is null then false
    when lower(replace(coalesce(a.channel,''),' ','_')) not in ('email','e-mail','linkedin_dm') then true
    when a.action_type not in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm') then true
    else coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
      and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')<>''
      and exists (
        select 1
        from public.powerhouse_message_quality_v1 q
        where q.action_id=a.action_id
          and q.message_hash=a.evidence#>>'{commercial_intelligence,message_hash}'
          and q.passed=true
      )
  end
  from public.powerhouse_sales_actions a
  where a.action_id=p_action_id
$$;
revoke execute on function public.powerhouse_outbound_message_quality_ready_v1(uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_outbound_message_quality_ready_v1(uuid) to service_role;

create or replace function public.powerhouse_assert_outbound_message_quality_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if lower(replace(coalesce(new.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
     and new.action_type in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm')
     and new.status in ('waiting','done')
     and new.status is distinct from old.status
     and not coalesce(public.powerhouse_outbound_message_quality_ready_v1(new.action_id),false) then
    raise exception 'OUTBOUND_COPY_QUALITY_NOT_PROVEN action_id=%',new.action_id using errcode='P0001';
  end if;
  return new;
end $$;
revoke execute on function public.powerhouse_assert_outbound_message_quality_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_assert_outbound_message_quality_v1() to service_role;

drop trigger if exists powerhouse_outbound_message_quality_gate_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_outbound_message_quality_gate_v1
before update of status on public.powerhouse_sales_actions
for each row execute function public.powerhouse_assert_outbound_message_quality_v1();

create or replace function public.powerhouse_sales_outcome_message_lineage_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare v_ci jsonb;
begin
  if new.action_id is null then return new; end if;
  select coalesce(a.evidence->'commercial_intelligence','{}'::jsonb)
  into v_ci
  from public.powerhouse_sales_actions a
  where a.action_id=new.action_id;
  new.evidence:=coalesce(new.evidence,'{}'::jsonb)
    || jsonb_build_object('message_intelligence',coalesce(v_ci,'{}'::jsonb));
  return new;
end $$;
revoke execute on function public.powerhouse_sales_outcome_message_lineage_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_sales_outcome_message_lineage_v1() to service_role;

drop trigger if exists powerhouse_sales_outcome_message_lineage_v1 on public.powerhouse_sales_outcomes;
create trigger powerhouse_sales_outcome_message_lineage_v1
before insert or update of action_id on public.powerhouse_sales_outcomes
for each row execute function public.powerhouse_sales_outcome_message_lineage_v1();

update public.powerhouse_sales_outcomes o
set evidence=coalesce(o.evidence,'{}'::jsonb)
  || jsonb_build_object('message_intelligence',coalesce(a.evidence->'commercial_intelligence','{}'::jsonb))
from public.powerhouse_sales_actions a
where o.action_id=a.action_id
  and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>''
  and coalesce(o.evidence#>>'{message_intelligence,message_strategy}','')='';

create or replace view public.powerhouse_sales_play_performance_v1
with (security_invoker=true) as
select
  coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','unknown') play_key,
  a.channel,
  coalesce(
    a.evidence#>>'{commercial_intelligence,learning_key}',
    coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','unknown')||':'||lower(replace(a.channel,' ','_'))
  ) learning_key,
  count(distinct a.action_id)::int executed_actions,
  count(distinct o.outcome_id)::int observed_outcomes,
  count(distinct o.outcome_id) filter(where lower(o.outcome_type) not in ('sent','delivered','queued'))::int business_outcomes,
  count(distinct o.outcome_id) filter(where lower(o.outcome_type) ~ '(reply|response)')::int replies,
  count(distinct o.outcome_id) filter(where lower(o.outcome_type) ~ '(meeting|appointment)')::int meetings,
  count(distinct o.outcome_id) filter(where lower(o.outcome_type) ~ '(proposal|offer)')::int proposals,
  count(distinct o.outcome_id) filter(where lower(o.outcome_type) ~ '(won|order|revenue)')::int wins,
  coalesce(sum(o.revenue_eur),0)::numeric realized_revenue_eur,
  round(avg(nullif((a.evidence#>>'{commercial_intelligence,quality_score}')::numeric,0)),4) avg_quality_score,
  round(coalesce(
    count(distinct o.outcome_id) filter(where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|offer|won|order|revenue)')::numeric
    / nullif(count(distinct a.action_id),0),0
  ),4) positive_outcome_rate,
  max(a.executed_at) last_executed_at,
  max(o.occurred_at) last_outcome_at
from public.powerhouse_sales_actions a
left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
where a.executed_at>=now()-interval '180 days'
  and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>''
group by 1,2,3;
revoke all on public.powerhouse_sales_play_performance_v1 from public, anon, authenticated;
grant select on public.powerhouse_sales_play_performance_v1 to service_role;

create or replace function public.powerhouse_refresh_sales_play_learnings_v1()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_n int:=0; v_total int:=0; v_mature int:=0;
begin
  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,
    channel,sample_size,expires_at,updated_at
  )
  select
    'sales-play:'||md5(p.learning_key),
    'powerhouse','sales_play',
    'Sales play performance is learned from observed business outcomes and realized revenue, never from copy preference or send events alone.',
    jsonb_build_object(
      'contract','powerhouse-human-commercial-message-learning-v1',
      'play_key',p.play_key,'channel',p.channel,'learning_key',p.learning_key,
      'executed_actions',p.executed_actions,'observed_outcomes',p.observed_outcomes,
      'business_outcomes',p.business_outcomes,'replies',p.replies,'meetings',p.meetings,
      'proposals',p.proposals,'wins',p.wins,'realized_revenue_eur',p.realized_revenue_eur,
      'avg_quality_score',p.avg_quality_score,'positive_outcome_rate',p.positive_outcome_rate,
      'last_outcome_at',p.last_outcome_at
    ),
    jsonb_build_object(
      'primary_effect','message_strategy_to_business_outcome',
      'positive_outcome_rate',p.positive_outcome_rate,
      'realized_revenue_eur',p.realized_revenue_eur,
      'promotion_eligible',p.business_outcomes>=5,
      'truth_boundary','sent/delivered/queued do not count as business outcomes'
    ),
    case when p.business_outcomes>=20 then .90 when p.business_outcomes>=10 then .80 when p.business_outcomes>=5 then .70 else .35 end,
    case when p.business_outcomes>=5 then 'active' else 'hypothesis' end,
    p.channel,greatest(1,p.business_outcomes),now()+interval '30 days',now()
  from public.powerhouse_sales_play_performance_v1 p
  where p.play_key<>'unknown'
  on conflict(fingerprint) do update set
    evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,
    status=excluded.status,channel=excluded.channel,sample_size=excluded.sample_size,
    expires_at=excluded.expires_at,updated_at=now();

  get diagnostics v_n=row_count;
  select count(*),count(*) filter(where business_outcomes>=5)
    into v_total,v_mature
  from public.powerhouse_sales_play_performance_v1
  where play_key<>'unknown';

  return jsonb_build_object(
    'contract','powerhouse-human-commercial-message-learning-v1',
    'strategies_seen',v_total,
    'strategies_with_mature_business_outcomes',v_mature,
    'learning_rows_touched',v_n,
    'truth_boundary','no strategy promotion from sends alone; >=5 business outcomes required'
  );
end $$;
revoke execute on function public.powerhouse_refresh_sales_play_learnings_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_sales_play_learnings_v1() to service_role;

create or replace function public.powerhouse_outbound_copy_gate_assurance_v1()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_ready uuid; v_unready uuid; v_ready_ok boolean; v_unready_ok boolean;
begin
  select a.action_id into v_ready
  from public.powerhouse_sales_actions a
  where lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm')
    and public.powerhouse_outbound_message_quality_ready_v1(a.action_id)
  order by a.updated_at desc limit 1;

  select a.action_id into v_unready
  from public.powerhouse_sales_actions a
  where lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm')
    and a.status in ('prepared','suggested','waiting')
    and not public.powerhouse_outbound_message_quality_ready_v1(a.action_id)
  order by a.priority desc,a.updated_at desc limit 1;

  v_ready_ok:=case when v_ready is null then false else public.powerhouse_outbound_message_quality_ready_v1(v_ready) end;
  v_unready_ok:=case when v_unready is null then true else not public.powerhouse_outbound_message_quality_ready_v1(v_unready) end;

  return jsonb_build_object(
    'contract','powerhouse-outbound-copy-gate-assurance-v1',
    'healthy',v_ready_ok and v_unready_ok,
    'quality_ready_sample',v_ready,
    'quality_ready_sample_passed',v_ready_ok,
    'quality_unready_sample',v_unready,
    'quality_unready_sample_rejected',v_unready_ok,
    'gate','exact passed message_hash required before outbound waiting/done'
  );
end $$;
revoke execute on function public.powerhouse_outbound_copy_gate_assurance_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_outbound_copy_gate_assurance_v1() to service_role;


create or replace function public.powerhouse_commercial_closed_loop_v6(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_core jsonb; v_fabric jsonb; v_depth jsonb; v_prov jsonb; v_one jsonb; v_status jsonb;
  v_compound jsonb; v_learning_at timestamptz; v_messages jsonb; v_play_learning jsonb; v_msg_health jsonb;
begin
  v_one:=public.powerhouse_one_brain_completeness_assurance_v1();
  v_fabric:=public.powerhouse_intelligence_fabric_assurance_v1();
  v_depth:=public.powerhouse_sales_intelligence_depth_assurance_v1();
  v_prov:=public.powerhouse_sales_provenance_assurance_v1();

  select e.evidence,e.occurred_at into v_compound,v_learning_at
  from public.powerhouse_runtime_events e
  where e.event_type='daily_compound_learning_cycle'
    and e.source='powerhouse-daily-compound-learning-v1'
    and e.subject_key='company-intelligence'
  order by e.occurred_at desc limit 1;

  v_core:=public.powerhouse_sales_machine_core_v1(p_run_date);
  v_messages:=public.powerhouse_refresh_message_plans_v1(200);
  v_play_learning:=public.powerhouse_refresh_sales_play_learnings_v1();
  select to_jsonb(h) into v_msg_health
  from public.powerhouse_human_sales_message_health_v1 h;
  v_status:=public.powerhouse_linkedin_sales_machine_status_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-commercial-closed-loop-v6',
    'run_date',p_run_date,
    'healthy',
      coalesce((v_one->>'healthy')::boolean,false)
      and coalesce((v_fabric->>'healthy')::boolean,false)
      and coalesce((v_depth->>'healthy')::boolean,false)
      and coalesce((v_prov->>'healthy')::boolean,false)
      and coalesce((v_core->>'healthy')::boolean,false)
      and v_compound is not null
      and coalesce((v_msg_health->>'actions_without_strategy')::int,0)=0
      and coalesce((v_msg_health->>'drafts_without_quality')::int,0)=0,
    'one_brain',v_one,
    'intelligence_fabric',v_fabric,
    'intelligence_depth',v_depth,
    'provenance',v_prov,
    'compound_learning',coalesce(v_compound,'{}'::jsonb),
    'compound_learning_observed_at',v_learning_at,
    'compound_learning_owner','powerhouse-daily-compound-learning-v1',
    'duplicate_learning_run_forbidden',true,
    'sales_machine_core',v_core,
    'human_message_planning',v_messages,
    'human_message_health',v_msg_health,
    'sales_play_learning',v_play_learning,
    'linkedin_salesrobot',v_status,
    'architecture','customer-market-intelligence-brain <-> canonical-heart <-> commercial-decision-brain',
    'lineage','observe->understand->predict->value/problem->strategy/play/psychology->message/quality->nba/channel->provider->outcome/revenue->attribution->calibration/learning->next decision',
    'outbound_copy_gate','database + executor enforced; exact quality-passed message hash required',
    'external_send_executed_by_this_cycle',false,
    'executed_at',now()
  );
end $$;
revoke execute on function public.powerhouse_commercial_closed_loop_v6(date) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_closed_loop_v6(date) to service_role;
