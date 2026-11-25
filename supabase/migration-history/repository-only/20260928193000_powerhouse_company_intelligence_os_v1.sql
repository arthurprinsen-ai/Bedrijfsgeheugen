-- Powerhouse Company Intelligence OS v1
-- Unifies graph, context, autonomous action, outcome memory and compound learning
-- over existing canonical Powerhouse tables. CRM remains a source, never the brain.

create or replace view public.powerhouse_company_graph_nodes_v1
with (security_invoker=true) as
select
  'person'::text as node_type,
  coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) as node_key,
  lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\\s+',' ','g')) as company_key,
  coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) as person_key,
  coalesce(nullif(trim(c.naam),''), nullif(trim(c.linkedin_url),''), 'unknown') as label,
  jsonb_build_object(
    'role',c.rol,'segment',c.segment,'status',c.status,'priority',c.prioriteit,
    'source',c.bron,'has_email',c.email is not null,'has_phone',c.telefoon is not null,
    'linkedin_url',c.linkedin_url
  ) as payload,
  c.bijgewerkt_op as observed_at
from public.bg_connecties c
where coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) is not null

union all
select
  'company',
  lower(regexp_replace(trim(c.bedrijf),'\\s+',' ','g')),
  lower(regexp_replace(trim(c.bedrijf),'\\s+',' ','g')),
  null,
  c.bedrijf,
  jsonb_build_object(
    'people_count',count(*)::int,
    'customer_count',count(*) filter(where c.status='klant')::int,
    'active_relationship_count',count(*) filter(where c.status in ('aangeboden','in_gesprek','klant'))::int
  ),
  max(c.bijgewerkt_op)
from public.bg_connecties c
where nullif(trim(coalesce(c.bedrijf,'')),'') is not null
group by lower(regexp_replace(trim(c.bedrijf),'\\s+',' ','g')), c.bedrijf

union all
select
  'opportunity',
  o.opportunity_key,
  o.company_key,
  o.person_key,
  coalesce(o.opportunity_key,o.opportunity_id::text),
  jsonb_build_object(
    'stage',o.stage,'status',o.status,'probability',o.probability,'confidence',o.confidence,
    'expected_value_eur',o.expected_value_eur,'expected_revenue_value',o.expected_revenue_value,
    'evidence',o.evidence
  ),
  coalesce(o.last_evidence_at,o.updated_at)
from public.powerhouse_opportunities o

union all
select
  'action',
  a.action_id::text,
  a.company_key,
  a.person_key,
  a.action_type,
  jsonb_build_object(
    'channel',a.channel,'status',a.status,'priority',a.priority,'reason',a.reason,
    'expected_value_eur',a.expected_value_eur,'evidence',a.evidence
  ),
  coalesce(a.executed_at,a.updated_at,a.created_at)
from public.powerhouse_sales_actions a

union all
select
  'outcome',
  o.outcome_id::text,
  o.company_key,
  o.person_key,
  o.outcome_type,
  jsonb_build_object(
    'revenue_eur',o.revenue_eur,'channel',o.channel,'evidence',o.evidence,
    'action_id',o.action_id
  ),
  o.occurred_at
from public.powerhouse_sales_outcomes o;

revoke all on public.powerhouse_company_graph_nodes_v1 from public,anon,authenticated;
grant select on public.powerhouse_company_graph_nodes_v1 to service_role;

create or replace view public.powerhouse_company_graph_edges_v1
with (security_invoker=true) as
select
  'person_company'::text as edge_type,
  coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) as from_key,
  lower(regexp_replace(trim(c.bedrijf),'\\s+',' ','g')) as to_key,
  jsonb_build_object('role',c.rol,'status',c.status,'priority',c.prioriteit) as payload,
  c.bijgewerkt_op as observed_at
from public.bg_connecties c
where coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) is not null
  and nullif(trim(coalesce(c.bedrijf,'')),'') is not null

union all
select
  'person_opportunity',o.person_key,o.opportunity_key,
  jsonb_build_object('stage',o.stage,'status',o.status,'probability',o.probability,'confidence',o.confidence),
  coalesce(o.last_evidence_at,o.updated_at)
from public.powerhouse_opportunities o
where o.person_key is not null

union all
select
  'company_opportunity',o.company_key,o.opportunity_key,
  jsonb_build_object('stage',o.stage,'status',o.status,'expected_value_eur',o.expected_value_eur),
  coalesce(o.last_evidence_at,o.updated_at)
from public.powerhouse_opportunities o
where o.company_key is not null

union all
select
  'opportunity_action',a.opportunity_key,a.action_id::text,
  jsonb_build_object('action_type',a.action_type,'channel',a.channel,'status',a.status),
  coalesce(a.executed_at,a.updated_at,a.created_at)
from public.powerhouse_sales_actions a
where a.opportunity_key is not null

union all
select
  'action_outcome',o.action_id::text,o.outcome_id::text,
  jsonb_build_object('outcome_type',o.outcome_type,'revenue_eur',o.revenue_eur),
  o.occurred_at
from public.powerhouse_sales_outcomes o
where o.action_id is not null;

revoke all on public.powerhouse_company_graph_edges_v1 from public,anon,authenticated;
grant select on public.powerhouse_company_graph_edges_v1 to service_role;

create or replace view public.powerhouse_system_of_context_v1
with (security_invoker=true) as
with companies as (
  select distinct company_key
  from public.powerhouse_company_graph_nodes_v1
  where nullif(trim(coalesce(company_key,'')),'') is not null
),
people as (
  select company_key,count(*)::int people_count,max(observed_at) latest_people_at
  from public.powerhouse_company_graph_nodes_v1 where node_type='person'
  group by company_key
),
opps as (
  select company_key,
    count(*)::int opportunities,
    count(*) filter(where status='open')::int open_opportunities,
    coalesce(sum(expected_revenue_value) filter(where status='open'),0)::numeric expected_revenue_value,
    max(coalesce(last_evidence_at,updated_at)) latest_opportunity_at
  from public.powerhouse_opportunities group by company_key
),
actions as (
  select company_key,
    count(*)::int actions_total,
    count(*) filter(where created_at>=now()-interval '30 days')::int actions_30d,
    count(*) filter(where status in ('prepared','suggested','waiting'))::int pending_actions,
    max(coalesce(executed_at,updated_at,created_at)) latest_action_at
  from public.powerhouse_sales_actions group by company_key
),
outcomes as (
  select company_key,
    count(*)::int outcomes_total,
    count(*) filter(where occurred_at>=now()-interval '90 days')::int outcomes_90d,
    coalesce(sum(revenue_eur),0)::numeric realized_revenue_eur,
    max(occurred_at) latest_outcome_at
  from public.powerhouse_sales_outcomes group by company_key
)
select
  c.company_key,
  coalesce(p.people_count,0) people_count,
  coalesce(o.opportunities,0) opportunities,
  coalesce(o.open_opportunities,0) open_opportunities,
  coalesce(o.expected_revenue_value,0) expected_revenue_value,
  coalesce(a.actions_total,0) actions_total,
  coalesce(a.actions_30d,0) actions_30d,
  coalesce(a.pending_actions,0) pending_actions,
  coalesce(x.outcomes_total,0) outcomes_total,
  coalesce(x.outcomes_90d,0) outcomes_90d,
  coalesce(x.realized_revenue_eur,0) realized_revenue_eur,
  greatest(p.latest_people_at,o.latest_opportunity_at,a.latest_action_at,x.latest_outcome_at) last_context_at,
  jsonb_build_object(
    'contract','powerhouse-system-of-context-v1',
    'company_graph',jsonb_build_object(
      'people',coalesce(p.people_count,0),
      'opportunities',coalesce(o.opportunities,0),
      'open_opportunities',coalesce(o.open_opportunities,0)
    ),
    'commercial_state',jsonb_build_object(
      'expected_revenue_value',coalesce(o.expected_revenue_value,0),
      'actions_30d',coalesce(a.actions_30d,0),
      'pending_actions',coalesce(a.pending_actions,0),
      'outcomes_90d',coalesce(x.outcomes_90d,0),
      'realized_revenue_eur',coalesce(x.realized_revenue_eur,0)
    ),
    'truth_boundary','Context is a derived projection over canonical evidence; it is not a separate CRM or truth store.'
  ) as context
from companies c
left join people p using(company_key)
left join opps o using(company_key)
left join actions a using(company_key)
left join outcomes x using(company_key);

revoke all on public.powerhouse_system_of_context_v1 from public,anon,authenticated;
grant select on public.powerhouse_system_of_context_v1 to service_role;

create or replace view public.powerhouse_autonomous_action_layer_v1
with (security_invoker=true) as
select
  a.action_id,a.dedupe_key,a.subject_key,a.person_key,a.company_key,a.action_type,a.channel,
  a.priority,a.reason,a.status,a.due_at,a.expected_value_eur,a.evidence,
  c.context as system_context,
  case
    when a.status not in ('prepared','suggested','waiting') then false
    when a.due_at is not null and a.due_at>now() then false
    else true
  end execution_candidate,
  jsonb_build_object(
    'contract','powerhouse-autonomous-action-layer-v1',
    'requires_context',true,
    'requires_lineage',true,
    'external_side_effects_respect_existing_channel_identity_consent_and_authorization_gates',true
  ) as action_contract
from public.powerhouse_sales_actions a
left join public.powerhouse_system_of_context_v1 c on c.company_key=a.company_key;

revoke all on public.powerhouse_autonomous_action_layer_v1 from public,anon,authenticated;
grant select on public.powerhouse_autonomous_action_layer_v1 to service_role;

create or replace view public.powerhouse_outcome_memory_v1
with (security_invoker=true) as
select
  'sales_outcome'::text memory_type,
  o.outcome_id::text memory_id,
  o.company_key,o.person_key,o.action_id::text origin_action_id,
  o.outcome_type outcome_class,
  o.revenue_eur realized_value,
  'EUR'::text unit,
  o.evidence,
  o.occurred_at observed_at
from public.powerhouse_sales_outcomes o

union all
select
  'realized_value',
  r.observation_id::text,
  null,null,r.cycle_id::text,
  r.value_type,
  r.numeric_value,
  coalesce(r.currency,r.unit),
  jsonb_build_object(
    'evidence_ref',r.evidence_ref,
    'provenance',r.provenance,
    'source_entity_type',r.source_entity_type,
    'source_entity_id',r.source_entity_id
  ),
  r.observed_at
from public.powerhouse_realized_values r;

revoke all on public.powerhouse_outcome_memory_v1 from public,anon,authenticated;
grant select on public.powerhouse_outcome_memory_v1 to service_role;

create or replace view public.powerhouse_compound_intelligence_v1
with (security_invoker=true) as
select
  c.company_key,
  c.people_count,c.open_opportunities,c.expected_revenue_value,c.actions_30d,c.pending_actions,
  c.outcomes_90d,c.realized_revenue_eur,c.last_context_at,
  case
    when c.realized_revenue_eur>0 then 'reinforce_verified_value_path'
    when c.outcomes_90d>0 and c.realized_revenue_eur=0 then 'learn_from_non_revenue_outcomes'
    when c.actions_30d>0 and c.outcomes_90d=0 then 'measure_or_adjust_action_policy'
    when c.open_opportunities>0 and c.actions_30d=0 then 'activate_next_best_action'
    else 'enrich_and_observe'
  end next_learning_move,
  jsonb_build_object(
    'contract','powerhouse-compound-intelligence-loop-v1',
    'loop',jsonb_build_array('know','understand','decide','act','measure','learn'),
    'context',c.context,
    'rule','Every next decision must consume verified outcomes and realized value where available.'
  ) intelligence
from public.powerhouse_system_of_context_v1 c;

revoke all on public.powerhouse_compound_intelligence_v1 from public,anon,authenticated;
grant select on public.powerhouse_compound_intelligence_v1 to service_role;

comment on view public.powerhouse_company_graph_nodes_v1 is
'Canonical Company Graph node projection over existing Powerhouse relationship, opportunity, action and outcome truth. No parallel CRM.';
comment on view public.powerhouse_company_graph_edges_v1 is
'Canonical Company Graph relation projection linking people, companies, opportunities, actions and outcomes.';
comment on view public.powerhouse_system_of_context_v1 is
'Company-level System of Context compiled from canonical graph and commercial evidence.';
comment on view public.powerhouse_autonomous_action_layer_v1 is
'Bounded action projection: decisions become executable candidates only with canonical context and existing execution gates.';
comment on view public.powerhouse_outcome_memory_v1 is
'Outcome Memory projection over observed outcomes and realized value; never synthesizes success.';
comment on view public.powerhouse_compound_intelligence_v1 is
'Compound Intelligence Loop projection feeding observed outcomes and realized value back into the next decision.';


-- Company Intelligence OS v1 hardening:
-- execution boundaries, evidence-backed outcome memory, context confidence and canonical orchestrator.

create or replace view public.powerhouse_autonomous_action_layer_v1
with (security_invoker=true) as
select
  a.action_id,a.dedupe_key,a.subject_key,a.person_key,a.company_key,a.action_type,a.channel,
  a.priority,a.reason,a.status,a.due_at,a.expected_value_eur,a.evidence,
  c.context as system_context,
  case
    when a.status not in ('prepared','suggested','waiting') then false
    when a.due_at is not null and a.due_at>now() then false
    when lower(coalesce(a.evidence#>>'{execution_gate,human_authorization_required}',''))='true' then false
    when lower(coalesce(a.evidence#>>'{execution_gate,unsolicited_outreach_requires_human_authorization}',''))='true' then false
    else true
  end execution_candidate,
  jsonb_build_object(
    'contract','powerhouse-autonomous-action-layer-v1',
    'requires_context',true,
    'requires_lineage',true,
    'external_side_effects_respect_existing_channel_identity_consent_and_authorization_gates',true
  ) as action_contract,
  case
    when a.status in ('done','skipped','expired','error') then 'terminal'
    when lower(coalesce(a.evidence#>>'{execution_gate,human_authorization_required}',''))='true'
      or lower(coalesce(a.evidence#>>'{execution_gate,unsolicited_outreach_requires_human_authorization}',''))='true'
      then 'human_gate'
    when a.action_type in ('research_enrichment','internal_analysis','context_refresh') then 'autonomous_internal'
    when a.status='prepared' then 'runtime_governed'
    else 'policy_review'
  end execution_boundary,
  case when a.outcome_id is null then null else 'sales_outcome:'||a.outcome_id::text end outcome_memory_key
from public.powerhouse_sales_actions a
left join public.powerhouse_system_of_context_v1 c
  on lower(regexp_replace(trim(coalesce(c.company_key,'')),'\\s+',' ','g'))=
     lower(regexp_replace(trim(coalesce(a.company_key,'')),'\\s+',' ','g'));

revoke all on public.powerhouse_autonomous_action_layer_v1 from public,anon,authenticated;
grant select on public.powerhouse_autonomous_action_layer_v1 to service_role;

drop view if exists public.powerhouse_compound_intelligence_v1;
drop view if exists public.powerhouse_outcome_memory_v1;

create view public.powerhouse_outcome_memory_v1
with (security_invoker=true) as
select
  'sales_outcome'::text memory_type,
  o.outcome_id::text memory_id,
  nullif(lower(regexp_replace(trim(coalesce(o.company_key,'')),'\\s+',' ','g')),'') company_key,
  o.person_key,o.action_id::text origin_action_id,
  o.outcome_type outcome_class,
  o.revenue_eur realized_value,
  'EUR'::text unit,
  o.evidence,
  o.occurred_at observed_at,
  'powerhouse_sales_outcomes:'||o.outcome_id::text canonical_ref,
  (coalesce(o.evidence,'{}'::jsonb) <> '{}'::jsonb) verified
from public.powerhouse_sales_outcomes o

union all
select
  'realized_value',
  r.observation_id::text,
  null,
  null,
  r.cycle_id::text,
  r.value_type,
  r.numeric_value,
  coalesce(r.currency,r.unit),
  jsonb_build_object(
    'evidence_ref',r.evidence_ref,
    'provenance',r.provenance,
    'source_entity_type',r.source_entity_type,
    'source_entity_id',r.source_entity_id
  ),
  r.observed_at,
  'powerhouse_realized_values:'||r.observation_id::text,
  nullif(trim(coalesce(r.evidence_ref,'')),'') is not null
from public.powerhouse_realized_values r;

revoke all on public.powerhouse_outcome_memory_v1 from public,anon,authenticated;
grant select on public.powerhouse_outcome_memory_v1 to service_role;

create view public.powerhouse_compound_intelligence_v1
with (security_invoker=true) as
with verified_outcomes as (
  select company_key,count(*)::integer verified_outcomes,max(observed_at) latest_verified_outcome_at
  from public.powerhouse_outcome_memory_v1
  where company_key is not null and verified
  group by company_key
)
select
  c.company_key,
  c.people_count,c.open_opportunities,c.expected_revenue_value,c.actions_30d,c.pending_actions,
  c.outcomes_90d,c.realized_revenue_eur,c.last_context_at,
  coalesce(v.verified_outcomes,0) verified_outcomes,
  case
    when c.pending_actions>0 then 'act_and_observe'
    when coalesce(v.verified_outcomes,0)>0 and c.open_opportunities>0 then 'learn_and_reprioritize'
    when c.open_opportunities>0 then 'decide_next_action'
    else 'enrich_context'
  end compound_loop_state,
  round(least(1,coalesce(v.verified_outcomes,0)::numeric/greatest(3,c.open_opportunities+1)),4) learning_density,
  jsonb_build_object(
    'contract','powerhouse-compound-intelligence-loop-v1',
    'loop',jsonb_build_array('know','understand','decide','act','observe','learn','compound'),
    'context',c.context,
    'verified_outcomes',coalesce(v.verified_outcomes,0),
    'rule','Every next decision must consume verified outcomes and realized value where available; learning is incomplete until it can alter a later decision.'
  ) intelligence
from public.powerhouse_system_of_context_v1 c
left join verified_outcomes v using(company_key);

revoke all on public.powerhouse_compound_intelligence_v1 from public,anon,authenticated;
grant select on public.powerhouse_compound_intelligence_v1 to service_role;

create or replace function public.powerhouse_run_company_intelligence_os_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_execution jsonb;
  v_result jsonb;
begin
  -- Reuse the canonical Powerhouse execution loop; this OS does not create a second scheduler or queue.
  v_execution:=public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(p_run_date);

  v_result:=jsonb_build_object(
    'contract','company-intelligence-os.v1',
    'category','AI-native company operating system / company intelligence platform',
    'crm_role','source',
    'powerhouse_role','company_intelligence_and_execution_brain',
    'loop',jsonb_build_array('know','understand','decide','act','observe','learn','compound'),
    'company_graph',jsonb_build_object(
      'nodes',(select count(*) from public.powerhouse_company_graph_nodes_v1),
      'edges',(select count(*) from public.powerhouse_company_graph_edges_v1)
    ),
    'system_of_context',jsonb_build_object(
      'companies',(select count(*) from public.powerhouse_system_of_context_v1),
      'fresh_30d',(select count(*) from public.powerhouse_system_of_context_v1 where last_context_at>=now()-interval '30 days')
    ),
    'autonomous_action_layer',jsonb_build_object(
      'actions',(select count(*) from public.powerhouse_autonomous_action_layer_v1),
      'autonomous_internal',(select count(*) from public.powerhouse_autonomous_action_layer_v1 where execution_boundary='autonomous_internal'),
      'runtime_governed',(select count(*) from public.powerhouse_autonomous_action_layer_v1 where execution_boundary='runtime_governed'),
      'human_gated',(select count(*) from public.powerhouse_autonomous_action_layer_v1 where execution_boundary='human_gate')
    ),
    'outcome_memory',jsonb_build_object(
      'observations',(select count(*) from public.powerhouse_outcome_memory_v1),
      'verified',(select count(*) from public.powerhouse_outcome_memory_v1 where verified)
    ),
    'compound_intelligence',jsonb_build_object(
      'companies',(select count(*) from public.powerhouse_compound_intelligence_v1),
      'learning_companies',(select count(*) from public.powerhouse_compound_intelligence_v1 where verified_outcomes>0)
    ),
    'canonical_execution',v_execution,
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'company-intelligence-os:'||p_run_date::text,
    'company_intelligence_os_cycle','company-intelligence-os.v1','company-intelligence-os',
    now(),v_result,
    jsonb_build_object('no_parallel_crm',true,'no_parallel_truth',true,'existing_action_fabric_reused',true),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,updated_at=now();

  return v_result;
end;
$$;

revoke execute on function public.powerhouse_run_company_intelligence_os_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_run_company_intelligence_os_v1(date) to service_role;

comment on function public.powerhouse_run_company_intelligence_os_v1(date) is
'Company Intelligence OS orchestrator. Reuses the canonical execution loop, then reads Company Graph, System of Context, bounded action layer, verified Outcome Memory and Compound Intelligence. No parallel CRM, scheduler or truth store.';
