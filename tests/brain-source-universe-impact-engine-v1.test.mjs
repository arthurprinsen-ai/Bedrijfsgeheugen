import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const read=p=>readFile(p,'utf8');

test('source universe covers 35 external and 10 internal domains',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  const external=[
    'legal-regulation','cyber-threats','ai-technology','competition','customer-market-behavior',
    'macro-economy','finance-capital','subsidies-tax','labor-market','skills-capabilities',
    'energy','climate-physical-risk','commodities','supply-chain-logistics','geopolitics',
    'international-trade','sustainability-esg','demography','social-cultural','media-news',
    'social-communities','search-internet','pricing','real-estate-location','mobility',
    'public-procurement','business-registers','ma-investment','patents-ip','standards',
    'reputation-trust','insurance','fraud-fincrime','health-disruption','local-environment'
  ];
  const internal=[
    'internal-finance','internal-customers-sales','internal-people-hr','internal-operations',
    'internal-projects','internal-systems-data','internal-documents-knowledge',
    'internal-suppliers-procurement','internal-marketing-digital','internal-service-quality'
  ];
  for(const key of [...external,...internal])assert.ok(sql.includes(`('${key}'`),key);
  assert.equal(external.length,35);
  assert.equal(internal.length,10);
});

test('catalog capability, availability and evidence are distinct truths',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  assert.match(sql,/availability_state text not null default 'CATALOGUED'/);
  for(const state of ['CATALOGUED','AVAILABLE','CONNECTED','OBSERVED','LIVE','STALE','ERROR'])assert.ok(sql.includes(`'${state}'`),state);
  assert.match(sql,/powerhouse_refresh_intelligence_source_availability_v1/);
  assert.match(sql,/powerhouse_evidence_source_observations/);
  assert.match(sql,/catalog capability != connected evidence/);
});

test('external signals are canonical and tenant impact is separate',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  assert.match(sql,/primary key \(signal_key\)/);
  assert.match(sql,/foreign key \(signal_key\)\s+references public\.powerhouse_intelligence_signal_projection_v1\(signal_key\)/s);
  assert.match(sql,/EXTERNAL_REFRESH_CANONICAL_ONLY/);
  assert.match(sql,/TENANT_COMPANY_CONTEXT_REQUIRED/);
  assert.match(sql,/where signal_key=p_signal_key and tenant_id='canonical'/);
  assert.doesNotMatch(sql,/references public\.powerhouse_intelligence_signal_projection_v1\(tenant_id,signal_key\)/);
});

test('impact and euro values fail closed until tenant evidence exists',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  assert.match(sql,/when p_probability is null or p_magnitude is null or p_exposure is null then null/);
  assert.match(sql,/INTELLIGENCE_IMPACT_EVIDENCE_REQUIRED/);
  assert.match(sql,/estimated_value_eur numeric/);
  assert.match(sql,/estimated_loss_eur numeric/);
  assert.doesNotMatch(sql,/estimated_value_eur numeric not null/i);
  assert.doesNotMatch(sql,/estimated_loss_eur numeric not null/i);
  assert.match(sql,/money_values_require_evidence/);
});

test('canonical action materialization reuses Brain obligations and requires scored tenant impact',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  assert.match(sql,/powerhouse_materialize_intelligence_action_v1/);
  assert.match(sql,/INTELLIGENCE_ACTION_NOT_READY/);
  assert.match(sql,/INTELLIGENCE_COMPANY_IMPACT_NOT_SCORED/);
  assert.match(sql,/public\.brain_create_obligation\(/);
  assert.match(sql,/brain_obligation:/);
  assert.doesNotMatch(sql,/create table if not exists public\.[a-z0-9_]*(task|queue)[a-z0-9_]*/i);
});

test('fulfilled obligation is not treated as outcome; DONE requires verified Outcome Memory',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  assert.match(sql,/powerhouse_reconcile_intelligence_outcomes_v1/);
  assert.match(sql,/powerhouse_outcome_memory_v1 m/);
  assert.match(sql,/m\.verified=true/);
  assert.match(sql,/set status='DONE'/);
  assert.match(sql,/FULFILLED_IS_NOT_BUSINESS_OUTCOME/);
  assert.match(sql,/learning_authority','powerhouse_run_daily_compound_learning_v1/);
});

test('intelligence reuses existing scheduler mux and creates no parallel cron writer',async()=>{
  const [sql,registry]=await Promise.all([
    read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql'),
    read('powerhouse/assurance/loop-registry.json')
  ]);
  assert.match(sql,/create or replace function public\.powerhouse_runtime_scheduler_mux_v3/);
  assert.match(sql,/extract\(minute from p_now\)::integer=54/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
  assert.match(registry,/"loop_key": "external-intelligence-universe"/);
  assert.doesNotMatch(registry,/"loop_key": "environment-radar"/);
});

test('new intelligence surfaces are server-only and RLS protected',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  const tables=[
    'powerhouse_intelligence_domain_registry_v1',
    'powerhouse_intelligence_source_catalog_v1',
    'powerhouse_intelligence_signal_projection_v1',
    'powerhouse_intelligence_company_impact_v1',
    'powerhouse_intelligence_action_candidate_v1',
    'powerhouse_intelligence_snapshot_v1'
  ];
  for(const table of tables){
    assert.ok(sql.includes(`alter table public.${table} enable row level security`),table);
    assert.ok(sql.includes(`revoke all on table public.${table} from public, anon, authenticated`),table);
  }
  assert.doesNotMatch(sql,/grant\s+(select|insert|update|delete|all).*\b(anon|authenticated)\b/i);
  assert.match(sql,/grant execute on function public\.powerhouse_refresh_external_intelligence_universe_v1\(text,integer\) to service_role/);
});

test('Portal projects canonical outside world plus authenticated tenant impact only',async()=>{
  const [api,module,registry,shell]=await Promise.all([
    read('netlify/functions/portal-ondernemersdata.mjs'),
    read('portal-v2/modules/entrepreneur-intelligence.js'),
    read('portal-v2/page-registry.js'),
    read('portal-v2/page-shell.js')
  ]);
  assert.match(api,/getUser\(request\)/);
  assert.match(api,/resolveIdentityTenant/);
  assert.match(api,/tenant_id=eq\.canonical/);
  assert.match(api,/powerhouse_intelligence_company_impact_v1/);
  assert.match(api,/tenant_id=eq\.\$\{tenant\}/);
  assert.match(api,/monetaryImpactSynthesized:false/);
  assert.match(api,/catalogCapabilityIsConnectionTruth:false/);
  assert.match(module,/Source → evidence → signal → impact → actie → outcome → learning/);
  assert.match(module,/Nog niet bewezen · eigen bedrijfscontext nodig/);
  assert.match(registry,/omgevingsradar/);
  assert.match(shell,/omgevingsradar/);
});

test('System Map, Brain learning, skill and ledger inherit one canonical lineage',async()=>{
  const [map,learning,skill,doc,ledger]=await Promise.all([
    read('platform/system-map/canonical-system-map.mjs'),
    read('brain/learning/2026-10-07-source-universe-impact-engine-v1.json'),
    read('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md'),
    read('docs/source-universe-impact-engine-v1.md'),
    read('docs/development-ledger-events/2026-10-07-source-universe-impact-engine-v1.md')
  ]);
  for(const source of [map,learning,skill,doc,ledger])assert.match(source,/source.universe|Source Universe/i);
  assert.match(map,/tenantImpactOverlayOnly:true/);
  assert.match(map,/fulfilledObligationIsNotBusinessOutcome:true/);
  assert.match(learning,/canonical_external_signals_never_receive_tenant_impact/);
  assert.match(skill,/Catalog ≠ connected/);
  assert.match(doc,/FULFILLED/);
  assert.match(ledger,/CANDIDATE_PROTECTED_DELIVERY/);
});

test('changed JavaScript parses under Node',()=>{
  for(const path of [
    'netlify/functions/portal-ondernemersdata.mjs',
    'portal-v2/modules/entrepreneur-intelligence.js',
    'portal-v2/page-registry.js',
    'portal-v2/page-shell.js',
    'platform/system-map/canonical-system-map.mjs'
  ])execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
});


test('internal evidence projection is tenant-scoped and relation inference never claims causality',async()=>{
  const [sql,map,skill]=await Promise.all([
    read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql'),
    read('platform/system-map/canonical-system-map.mjs'),
    read('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md')
  ]);
  assert.match(sql,/powerhouse_project_internal_evidence_signal_v1/);
  assert.match(sql,/TENANT_SOURCE_OBSERVATION_SCOPE_REQUIRED/);
  assert.match(sql,/powerhouse_intelligence_signal_relation_v1/);
  assert.match(sql,/powerhouse_refresh_signal_relations_v1/);
  assert.match(sql,/causality_claimed',false/);
  assert.match(sql,/causal_hypotheses_synthesized',false/);
  assert.match(map,/internalSignalsRequireTenantScopedEvidence:true/);
  assert.match(map,/correlationNeverAutoPromotedToCausality:true/);
  assert.match(skill,/Correlation is not causality/);
});

test('SQL function bodies do not contain broken single-dollar delimiters',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  const bad=sql.split('\n').filter(line=>line.trim()==='as $'||line.trim()==='$;');
  assert.deepEqual(bad,[]);
});
