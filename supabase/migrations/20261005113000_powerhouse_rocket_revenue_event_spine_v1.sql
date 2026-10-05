-- Powerhouse Rocket Revenue Event Spine v1
-- Canonical revenue/event/identity/attribution contract over existing Powerhouse stores.
-- Existing-state-first / reuse-first: no parallel CRM, event store, experiment engine or action engine.

create table if not exists public.powerhouse_revenue_event_types_v1 (
  event_type text primary key,
  funnel_stage text not null,
  intent_weight numeric(8,4) not null default 0 check (intent_weight between 0 and 1),
  is_conversion boolean not null default false,
  is_revenue_signal boolean not null default false,
  active boolean not null default true,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_revenue_event_types_v1 enable row level security;
revoke all on public.powerhouse_revenue_event_types_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_revenue_event_types_v1 to service_role;
drop policy if exists powerhouse_revenue_event_types_service_v1 on public.powerhouse_revenue_event_types_v1;
create policy powerhouse_revenue_event_types_service_v1 on public.powerhouse_revenue_event_types_v1
for all to service_role using (true) with check (true);

insert into public.powerhouse_revenue_event_types_v1(event_type,funnel_stage,intent_weight,is_conversion,is_revenue_signal,evidence)
values
('page_view','discover',0.03,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('organic_landing','discover',0.08,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('engaged_view','consider',0.12,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('primary_cta_click','consider',0.30,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('scan_started','consider',0.40,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('scan_completed','lead',0.70,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('form_submitted','lead',0.65,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('email_opened','consider',0.08,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('email_clicked','consider',0.25,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('email_replied','lead',0.65,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('linkedin_engaged','consider',0.18,false,false,'{"source":"rocket-revenue-spine-v1"}'),
('linkedin_dm_replied','lead',0.65,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('meeting_requested','lead',0.80,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('meeting_booked','decision',0.85,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('proposal_sent','decision',0.90,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('won','conversion',1.00,true,true,'{"source":"rocket-revenue-spine-v1"}'),
('lost','conversion',0.00,true,false,'{"source":"rocket-revenue-spine-v1"}'),
('revenue','conversion',1.00,true,true,'{"source":"rocket-revenue-spine-v1"}')
on conflict(event_type) do update set funnel_stage=excluded.funnel_stage,intent_weight=excluded.intent_weight,
is_conversion=excluded.is_conversion,is_revenue_signal=excluded.is_revenue_signal,active=excluded.active,
evidence=public.powerhouse_revenue_event_types_v1.evidence||excluded.evidence,updated_at=now();

create table if not exists public.powerhouse_identity_graph_v1 (
  graph_id uuid primary key default gen_random_uuid(),
  entity_type text not null check(entity_type in ('person','company')),
  entity_key text not null,
  person_key text,
  company_key text,
  identifier_type text not null,
  identifier_hash text not null,
  source text not null,
  confidence numeric(8,4) not null default .5 check(confidence between 0 and 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  unique(entity_type,identifier_type,identifier_hash)
);
create index if not exists idx_powerhouse_identity_graph_entity on public.powerhouse_identity_graph_v1(entity_type,entity_key);
create index if not exists idx_powerhouse_identity_graph_person on public.powerhouse_identity_graph_v1(person_key) where person_key is not null;
create index if not exists idx_powerhouse_identity_graph_company on public.powerhouse_identity_graph_v1(company_key) where company_key is not null;
alter table public.powerhouse_identity_graph_v1 enable row level security;
revoke all on public.powerhouse_identity_graph_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_identity_graph_v1 to service_role;
drop policy if exists powerhouse_identity_graph_service_v1 on public.powerhouse_identity_graph_v1;
create policy powerhouse_identity_graph_service_v1 on public.powerhouse_identity_graph_v1
for all to service_role using(true) with check(true);

create or replace function public.powerhouse_sync_identity_graph_v1()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_contacts int:=0; v_opps int:=0; v_events int:=0; v_now timestamptz:=now();
begin
  with raw as (
    select coalesce(nullif(trim(sleutel),''),'person:'||md5(coalesce(nullif(lower(trim(linkedin_url)),''),nullif(lower(trim(email)),''),nullif(lower(trim(naam)),''),'unknown'))) entity_key,
      nullif(trim(sleutel),'') person_key,nullif(lower(regexp_replace(trim(coalesce(bedrijf,'')),'\s+',' ','g')),'') company_key,
      x.identifier_type,md5(lower(trim(x.identifier_value))) identifier_hash,
      greatest(.50::numeric,least(1::numeric,coalesce(prioriteit,0)/100.0)) confidence,
      jsonb_build_object('relationship_status',status,'segment',segment,'source',coalesce(bron,'bg_connecties')) evidence,
      bijgewerkt_op source_updated_at
    from public.bg_connecties cross join lateral(values
      ('linkedin_url',nullif(linkedin_url,'')),('email',nullif(email,'')),('connection_key',nullif(sleutel,''))
    ) x(identifier_type,identifier_value) where x.identifier_value is not null
  ), src as (
    select distinct on(identifier_type,identifier_hash) entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from raw order by identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence)
  select 'person',entity_key,person_key,company_key,identifier_type,identifier_hash,'bg_connecties',confidence,v_now,v_now,evidence from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),last_seen_at=v_now,
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_contacts=row_count;

  with raw as (
    select case when nullif(trim(person_key),'') is not null then 'person' else 'company' end entity_type,
      coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) entity_key,
      nullif(trim(person_key),'') person_key,nullif(trim(company_key),'') company_key,
      case when nullif(trim(person_key),'') is not null then 'person_key' else 'company_key' end identifier_type,
      md5(lower(trim(coalesce(nullif(person_key,''),nullif(company_key,''),subject_key)))) identifier_hash,
      least(1::numeric,greatest(.25::numeric,coalesce(confidence,.5))) confidence,
      jsonb_build_object('opportunity_key',opportunity_key,'stage',stage,'status',status) evidence,updated_at source_updated_at
    from public.powerhouse_opportunities
    where coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) is not null
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash) entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from raw order by entity_type,identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence)
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'powerhouse_opportunities',confidence,v_now,v_now,evidence from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),last_seen_at=v_now,
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_opps=row_count;

  with raw as (
    select case when nullif(trim(payload->>'person_key'),'') is not null then 'person' else 'company' end entity_type,
      coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) entity_key,
      nullif(trim(payload->>'person_key'),'') person_key,nullif(trim(payload->>'company_key'),'') company_key,
      case when nullif(trim(payload->>'person_key'),'') is not null then 'event_person_key'
           when nullif(trim(payload->>'company_key'),'') is not null then 'event_company_key' else 'attribution_root_key' end identifier_type,
      md5(lower(trim(coalesce(nullif(payload->>'person_key',''),nullif(payload->>'company_key',''),nullif(canonical,''),attribution_root_key)))) identifier_hash,
      occurred_at,jsonb_build_object('source','growth_events','event_type',event_type) evidence
    from public.growth_events where is_robot is not true and occurred_at>=v_now-interval '180 days'
      and coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) is not null
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash) entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,occurred_at last_seen,evidence
    from raw order by entity_type,identifier_type,identifier_hash,occurred_at desc
  )
  insert into public.powerhouse_identity_graph_v1(entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence)
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'growth_events',.60,v_now,last_seen,evidence from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_events=row_count;

  return jsonb_build_object('contract','powerhouse-identity-graph-v1','contacts_touched',v_contacts,'opportunities_touched',v_opps,
    'events_touched',v_events,'nodes',(select count(distinct entity_type||':'||entity_key) from public.powerhouse_identity_graph_v1),
    'identifiers',(select count(*) from public.powerhouse_identity_graph_v1),
    'privacy_boundary','identifier values are not duplicated; only normalized hashes plus canonical person/company keys are stored','executed_at',v_now);
end $$;
revoke execute on function public.powerhouse_sync_identity_graph_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_sync_identity_graph_v1() to service_role;

create or replace view public.powerhouse_revenue_event_spine_v1 with(security_invoker=true) as
select 'growth_event'::text record_class,g.event_id record_id,g.occurred_at,g.event_type,
  coalesce(t.funnel_stage,g.funnel_stage,'unknown') funnel_stage,coalesce(t.intent_weight,0) intent_weight,
  coalesce(g.payload->>'subject_key',g.intent_owner,g.canonical,g.attribution_root_key) subject_key,
  nullif(g.payload->>'person_key','') person_key,nullif(g.payload->>'company_key','') company_key,
  coalesce(g.payload->>'channel',g.medium,g.source) channel,g.source,g.medium,g.campaign campaign_key,
  nullif(g.payload->>'content_key','') content_key,g.attribution_root_key,g.value event_value_eur,null::numeric realized_revenue_eur,g.payload evidence
from public.growth_events g left join public.powerhouse_revenue_event_types_v1 t on t.event_type=g.event_type and t.active
where g.is_robot is not true
union all
select 'sales_action',a.action_id::text,coalesce(a.executed_at,a.created_at),'sales_action_'||a.action_type,'action',.35,
  a.subject_key,a.person_key,a.company_key,a.channel,'powerhouse_sales_actions',null,a.campaign_key,a.content_key,a.opportunity_key,
  a.expected_value_eur,null,a.evidence from public.powerhouse_sales_actions a
union all
select 'sales_outcome',o.outcome_id::text,o.occurred_at,'sales_outcome_'||o.outcome_type,'outcome',
  case when lower(o.outcome_type)~'(won|order|sale|revenue)' then 1.0 when lower(o.outcome_type)~'(meeting|proposal|qualified|reply|response)' then .75 else .15 end,
  coalesce(o.opportunity_key,o.person_key,o.company_key),o.person_key,o.company_key,o.channel,'powerhouse_sales_outcomes',null,o.campaign_key,o.content_key,
  o.opportunity_key,o.revenue_eur,o.revenue_eur,o.evidence from public.powerhouse_sales_outcomes o;
revoke all on public.powerhouse_revenue_event_spine_v1 from public,anon,authenticated;
grant select on public.powerhouse_revenue_event_spine_v1 to service_role;

create or replace view public.powerhouse_prospect_intent_score_v1 with(security_invoker=true) as
with entities as (
 select distinct entity_type,entity_key,person_key,company_key from public.powerhouse_identity_graph_v1
), ev as (
 select coalesce(company_key,person_key,subject_key) entity_match,
   count(*) filter(where occurred_at>=now()-interval '30 days') events_30d,
   count(*) filter(where occurred_at>=now()-interval '90 days') events_90d,
   sum(intent_weight*case when occurred_at>=now()-interval '7 days' then 1.0 when occurred_at>=now()-interval '30 days' then .65 else .30 end)
     filter(where occurred_at>=now()-interval '90 days') weighted_intent,max(occurred_at) last_signal_at
 from public.powerhouse_revenue_event_spine_v1 group by 1
), opp as (
 select coalesce(company_key,person_key,subject_key) entity_match,max(coalesce(probability,0)) max_probability,
   max(coalesce(confidence,0)) max_confidence,max(coalesce(expected_value_eur,0)) max_expected_value_eur,
   count(*) filter(where coalesce(status,'open') not in ('closed','won','lost')) open_opportunities,max(last_evidence_at) last_opportunity_at
 from public.powerhouse_opportunities group by 1
), scored as (
 select e.*,coalesce(v.events_30d,0) events_30d,coalesce(v.events_90d,0) events_90d,
   least(1::numeric,coalesce(v.weighted_intent,0)/6.0) event_intent,coalesce(o.max_probability,0) opportunity_probability,
   coalesce(o.max_confidence,0) opportunity_confidence,coalesce(o.max_expected_value_eur,0) expected_value_eur,
   coalesce(o.open_opportunities,0) open_opportunities,greatest(v.last_signal_at,o.last_opportunity_at) last_signal_at,
   case when greatest(v.last_signal_at,o.last_opportunity_at)>=now()-interval '7 days' then 1.0
        when greatest(v.last_signal_at,o.last_opportunity_at)>=now()-interval '30 days' then .65
        when greatest(v.last_signal_at,o.last_opportunity_at)>=now()-interval '90 days' then .30 else 0 end recency_score
 from entities e left join ev v on v.entity_match=coalesce(e.company_key,e.person_key,e.entity_key)
 left join opp o on o.entity_match=coalesce(e.company_key,e.person_key,e.entity_key)
)
select *,round(100*least(1::numeric,greatest(0::numeric,.45*event_intent+.30*opportunity_probability+.15*opportunity_confidence+.10*recency_score)),2) intent_score,
 round(least(1::numeric,.20+.08*least(events_90d,5)::numeric+.20*(open_opportunities>0)::int+.20*(last_signal_at is not null)::int),4) intent_confidence,
 case when 100*least(1::numeric,.45*event_intent+.30*opportunity_probability+.15*opportunity_confidence+.10*recency_score)>=75 then 'hot'
      when 100*least(1::numeric,.45*event_intent+.30*opportunity_probability+.15*opportunity_confidence+.10*recency_score)>=50 then 'warm'
      when 100*least(1::numeric,.45*event_intent+.30*opportunity_probability+.15*opportunity_confidence+.10*recency_score)>=25 then 'nurture' else 'observe' end intent_state,
 jsonb_build_object('event_intent',event_intent,'opportunity_probability',opportunity_probability,'opportunity_confidence',opportunity_confidence,
   'recency_score',recency_score,'events_30d',events_30d,'events_90d',events_90d,'open_opportunities',open_opportunities) score_components
from scored;
revoke all on public.powerhouse_prospect_intent_score_v1 from public,anon,authenticated;
grant select on public.powerhouse_prospect_intent_score_v1 to service_role;

create index if not exists idx_growth_events_company_occurred_v1 on public.growth_events((nullif(payload->>'company_key','')),occurred_at desc)
 where is_robot is not true and nullif(payload->>'company_key','') is not null;
create index if not exists idx_growth_events_person_occurred_v1 on public.growth_events((nullif(payload->>'person_key','')),occurred_at desc)
 where is_robot is not true and nullif(payload->>'person_key','') is not null;
create index if not exists idx_growth_events_attribution_occurred_v1 on public.growth_events(attribution_root_key,occurred_at desc)
 where is_robot is not true and attribution_root_key is not null;
create index if not exists idx_sales_actions_opp_executed_v1 on public.powerhouse_sales_actions(opportunity_key,executed_at desc) where executed_at is not null;
create index if not exists idx_sales_actions_person_executed_v1 on public.powerhouse_sales_actions(person_key,executed_at desc) where executed_at is not null;
create index if not exists idx_sales_actions_company_executed_v1 on public.powerhouse_sales_actions(company_key,executed_at desc) where executed_at is not null;

create or replace view public.powerhouse_revenue_attribution_v2 with(security_invoker=true) as
with outcomes as(select * from public.powerhouse_sales_outcomes where occurred_at is not null),
touches as(
 select o.outcome_id,o.revenue_eur,o.occurred_at conversion_at,'sales_action'::text touch_type,a.action_id::text touch_id,
  coalesce(a.executed_at,a.created_at) touch_at,a.channel,a.campaign_key,a.content_key,a.opportunity_key,a.person_key,a.company_key,a.evidence touch_evidence
 from outcomes o join public.powerhouse_sales_actions a on a.executed_at is not null and a.executed_at<=o.occurred_at and a.executed_at>=o.occurred_at-interval '180 days'
 and ((o.opportunity_key is not null and a.opportunity_key=o.opportunity_key) or (o.person_key is not null and a.person_key=o.person_key) or (o.company_key is not null and a.company_key=o.company_key))
 union all
 select o.outcome_id,o.revenue_eur,o.occurred_at,'growth_event',g.event_id,g.occurred_at,coalesce(g.payload->>'channel',g.medium,g.source),g.campaign,
  g.payload->>'content_key',g.attribution_root_key,g.payload->>'person_key',g.payload->>'company_key',g.payload
 from outcomes o join public.growth_events g on g.is_robot is not true and g.occurred_at<=o.occurred_at and g.occurred_at>=o.occurred_at-interval '180 days'
 and ((o.company_key is not null and nullif(g.payload->>'company_key','')=o.company_key) or (o.person_key is not null and nullif(g.payload->>'person_key','')=o.person_key) or (o.opportunity_key is not null and g.attribution_root_key=o.opportunity_key))
 join public.powerhouse_revenue_event_types_v1 et on et.event_type=g.event_type and et.active and et.intent_weight>=.12
), ranked as(
 select t.*,row_number() over(partition by outcome_id order by touch_at,touch_type,touch_id) rn_first,
 row_number() over(partition by outcome_id order by touch_at desc,touch_type,touch_id) rn_last,count(*) over(partition by outcome_id) touch_count from touches t
), weighted as(
 select r.*,case when touch_count=1 then 1.0::numeric when touch_count=2 then .5::numeric when rn_first=1 then .20::numeric
  when rn_last=1 then .40::numeric else .40::numeric/nullif(touch_count-2,0) end attribution_weight,
 rn_first=1 is_first_touch,rn_last=1 is_conversion_touch from ranked r
)
select outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,opportunity_key,person_key,company_key,revenue_eur,
 round(attribution_weight,6) attribution_weight,round(revenue_eur*attribution_weight,2) attributed_revenue_eur,is_first_touch,is_conversion_touch,
 'position_based_20_40_40'::text attribution_model,.70::numeric attribution_confidence,
 jsonb_build_object('truth_boundary','multi-touch attribution allocates observed revenue across observed touches; it is not causal proof','touch_count',touch_count,'touch_evidence',touch_evidence) evidence
from weighted;
revoke all on public.powerhouse_revenue_attribution_v2 from public,anon,authenticated;
grant select on public.powerhouse_revenue_attribution_v2 to service_role;

create table if not exists public.powerhouse_revenue_attribution_snapshot_v1(
 outcome_id uuid not null,touch_type text not null,touch_id text not null,touch_at timestamptz not null,conversion_at timestamptz not null,
 channel text,campaign_key text,content_key text,opportunity_key text,person_key text,company_key text,revenue_eur numeric not null default 0,
 attribution_weight numeric not null,attributed_revenue_eur numeric not null,is_first_touch boolean not null,is_conversion_touch boolean not null,
 attribution_model text not null,attribution_confidence numeric not null,evidence jsonb not null default '{}'::jsonb,refreshed_at timestamptz not null default now(),
 primary key(outcome_id,touch_type,touch_id)
);
create index if not exists idx_revenue_attribution_snapshot_conversion_v1 on public.powerhouse_revenue_attribution_snapshot_v1(conversion_at desc);
create index if not exists idx_revenue_attribution_snapshot_company_v1 on public.powerhouse_revenue_attribution_snapshot_v1(company_key,conversion_at desc);
alter table public.powerhouse_revenue_attribution_snapshot_v1 enable row level security;
revoke all on public.powerhouse_revenue_attribution_snapshot_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_revenue_attribution_snapshot_v1 to service_role;
drop policy if exists powerhouse_revenue_attribution_snapshot_service_v1 on public.powerhouse_revenue_attribution_snapshot_v1;
create policy powerhouse_revenue_attribution_snapshot_service_v1 on public.powerhouse_revenue_attribution_snapshot_v1
for all to service_role using(true) with check(true);

create or replace function public.powerhouse_refresh_revenue_attribution_snapshot_v1()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_rows int:=0; v_now timestamptz:=now();
begin
 truncate table public.powerhouse_revenue_attribution_snapshot_v1;
 insert into public.powerhouse_revenue_attribution_snapshot_v1(
  outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,opportunity_key,person_key,company_key,revenue_eur,
  attribution_weight,attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,attribution_confidence,evidence,refreshed_at)
 select outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,opportunity_key,person_key,company_key,revenue_eur,
  attribution_weight,attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,attribution_confidence,evidence,v_now
 from public.powerhouse_revenue_attribution_v2;
 get diagnostics v_rows=row_count;
 return jsonb_build_object('contract','powerhouse-revenue-attribution-snapshot-v1','rows',v_rows,'refreshed_at',v_now);
end $$;
revoke execute on function public.powerhouse_refresh_revenue_attribution_snapshot_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_revenue_attribution_snapshot_v1() to service_role;

create or replace view public.powerhouse_next_best_action_contract_v1 with(security_invoker=true) as
select n.*,coalesce(ci.intent_score,pi.intent_score,0) canonical_intent_score,
 coalesce(ci.intent_confidence,pi.intent_confidence,0) canonical_intent_confidence,
 coalesce(ci.intent_state,pi.intent_state,'observe') canonical_intent_state,
 case when exists(select 1 from public.powerhouse_channel_capabilities_v1 c where lower(replace(c.channel,' ','_'))=lower(replace(n.recommended_channel,' ','_'))
      and upper(c.status) in('AVAILABLE','ACTIVE','READY','VERIFIED') and(c.expires_at is null or c.expires_at>now())) then 'verified_available'
      when exists(select 1 from public.powerhouse_channel_capabilities_v1 c where lower(replace(c.channel,' ','_'))=lower(replace(n.recommended_channel,' ','_'))) then 'known_not_ready'
      else 'unverified' end channel_capability_state,
 jsonb_build_object('contract','powerhouse-next-best-action-contract-v1','uses_existing_nba','powerhouse_commercial_next_best_action_v5',
   'intent_score',coalesce(ci.intent_score,pi.intent_score,0),'intent_state',coalesce(ci.intent_state,pi.intent_state,'observe'),
   'execution_boundary','existing consent, pressure, identity, dedupe and provider gates remain authoritative') canonical_contract
from public.powerhouse_commercial_next_best_action_v5 n
left join public.powerhouse_prospect_intent_score_v1 ci on ci.entity_type='company' and ci.company_key=n.company_key
left join public.powerhouse_prospect_intent_score_v1 pi on pi.entity_type='person' and pi.person_key=n.person_key;
revoke all on public.powerhouse_next_best_action_contract_v1 from public,anon,authenticated;
grant select on public.powerhouse_next_best_action_contract_v1 to service_role;

create or replace view public.powerhouse_revenue_event_spine_health_v1 with(security_invoker=true) as
with ids as(select count(*)::bigint identifier_count,count(distinct entity_type||':'||entity_key)::bigint entity_count from public.powerhouse_identity_graph_v1),
attrib as(select count(*)::bigint touch_count,coalesce(sum(attributed_revenue_eur),0) attributed_revenue_eur,max(refreshed_at) attribution_refreshed_at from public.powerhouse_revenue_attribution_snapshot_v1),
outcome_attributed as(select coalesce(sum(o.revenue_eur),0) attributable_realized from public.powerhouse_sales_outcomes o where exists(select 1 from public.powerhouse_revenue_attribution_snapshot_v1 a where a.outcome_id=o.outcome_id)),
gaps as(select count(*)::bigint outcome_gaps from public.powerhouse_sales_outcomes o where o.revenue_eur<>0 and not exists(select 1 from public.powerhouse_revenue_attribution_snapshot_v1 a where a.outcome_id=o.outcome_id))
select now() measured_at,(select count(*) from public.powerhouse_revenue_event_types_v1 where active) event_types,
 ids.identifier_count identity_identifiers,ids.entity_count identity_entities,ids.entity_count scored_prospects,
 (select count(*) from public.powerhouse_revenue_command_center_snapshot_v1) next_best_actions,attrib.touch_count attribution_touches,
 attrib.attributed_revenue_eur,(select coalesce(sum(revenue_eur),0) from public.powerhouse_sales_outcomes) realized_revenue_eur,
 abs(attrib.attributed_revenue_eur-outcome_attributed.attributable_realized)<=.05 attribution_balanced,gaps.outcome_gaps revenue_outcomes_without_touches,
 attrib.attribution_refreshed_at from ids cross join attrib cross join outcome_attributed cross join gaps;
revoke all on public.powerhouse_revenue_event_spine_health_v1 from public,anon,authenticated;
grant select on public.powerhouse_revenue_event_spine_health_v1 to service_role;

create or replace function public.powerhouse_revenue_event_spine_cycle_v1(p_run_date date default(now() at time zone 'Europe/Amsterdam')::date)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_identity jsonb;v_attribution jsonb;v_health jsonb;v_result jsonb;
begin
 v_identity:=public.powerhouse_sync_identity_graph_v1();
 v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
 select to_jsonb(h) into v_health from public.powerhouse_revenue_event_spine_health_v1 h;
 v_result:=jsonb_build_object('contract','powerhouse-rocket-revenue-event-spine-v1','run_date',p_run_date,'identity_graph',v_identity,
  'multi_touch_attribution',v_attribution,'health',v_health,
  'orchestration',jsonb_build_object('mode','shared_lineage_non_blocking',
    'relationship_revenue_owner','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'commercial_learning_owner','powerhouse-execution-learning-closure-v1 + outcome triggers',
    'next_best_action_owner','powerhouse_commercial_next_best_action_v5/live + powerhouse_next_best_action_contract_v1',
    'experiments_owner','powerhouse_mature_experiment_assignments_v1 scheduler',
    'revenue_snapshot_owner','powerhouse_refresh_revenue_intelligence_snapshot_v1 scheduler',
    'reason','Heavy existing engines keep independent idempotent schedulers; the canonical spine unifies their data contract without double execution or lock contention.'),
  'capabilities',jsonb_build_array('canonical_revenue_event_model','identity_company_graph','first_party_raw_events',
    'first_touch_multi_touch_conversion_attribution','continuous_intent_opportunity_score','next_best_action','contextual_lineage',
    'experiment_engine','revenue_writeback','won_lost_learning'),'executed_at',now());
 insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at)
 values('rocket-revenue-spine:'||p_run_date::text,'rocket_revenue_event_spine_cycle','powerhouse-rocket-revenue-event-spine-v1','growth-revenue-os',now(),v_result,
  jsonb_build_object('existing_state_first',true,'reuse_first',true,'no_parallel_crm',true,'non_blocking_orchestration',true),
  case when coalesce((v_health->>'attribution_balanced')::boolean,true) then 'actioned' else 'degraded' end,'VERIFIED',1,now())
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=excluded.updated_at;
 return v_result;
end $$;
revoke execute on function public.powerhouse_revenue_event_spine_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_revenue_event_spine_cycle_v1(date) to service_role;

select cron.unschedule(jobid) from cron.job where jobname='powerhouse-identity-graph-v1';
select cron.schedule('powerhouse-identity-graph-v1','*/15 * * * *',$$select public.powerhouse_sync_identity_graph_v1();$$);
select cron.unschedule(jobid) from cron.job where jobname='powerhouse-revenue-attribution-snapshot-v1';
select cron.schedule('powerhouse-revenue-attribution-snapshot-v1','7,22,37,52 * * * *',$$select public.powerhouse_refresh_revenue_attribution_snapshot_v1();$$);

comment on view public.powerhouse_revenue_event_spine_v1 is 'Canonical first-party commercial event spine over existing growth events, sales actions and sales outcomes. Reuse-first; no parallel event store.';
comment on view public.powerhouse_revenue_attribution_v2 is 'Observed position-based first/middle/conversion multi-touch revenue allocation. Attribution is not causal proof.';
comment on view public.powerhouse_next_best_action_contract_v1 is 'Canonical NBA contract over existing NBA v5 plus continuous intent and channel capability state; execution gates remain authoritative.';
