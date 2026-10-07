import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const read=p=>readFile(p,'utf8');

test('source universe covers all requested external and internal domains',async()=>{
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

test('source capability is kept separate from observed evidence and impact',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  for(const marker of [
    'powerhouse_intelligence_source_catalog_v1',
    'powerhouse_intelligence_signal_projection_v1',
    'powerhouse_intelligence_company_impact_v1',
    'powerhouse_intelligence_action_candidate_v1',
    'powerhouse_intelligence_snapshot_v1',
    'powerhouse_evidence_source_observations',
    'NEEDS_COMPANY_CONTEXT'
  ])assert.ok(sql.includes(marker),marker);
  assert.match(sql,/catalog capability != connected evidence/);
  assert.match(sql,/money_values_require_evidence/);
});

test('company impact score fails closed until probability magnitude and exposure exist',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  assert.match(sql,/when p_probability is null or p_magnitude is null or p_exposure is null then null/);
  assert.match(sql,/estimated_value_eur numeric/);
  assert.match(sql,/estimated_loss_eur numeric/);
  assert.doesNotMatch(sql,/estimated_value_eur numeric not null/i);
  assert.doesNotMatch(sql,/estimated_loss_eur numeric not null/i);
});

test('intelligence reuses existing scheduler mux and does not create a parallel cron writer',async()=>{
  const [sql,registry]=await Promise.all([
    read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql'),
    read('powerhouse/assurance/loop-registry.json')
  ]);
  assert.match(sql,/create or replace function public\.powerhouse_runtime_scheduler_mux_v3/);
  assert.match(sql,/extract\(minute from p_now\)::integer=54/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
  assert.match(registry,/external-intelligence-universe/);
  assert.match(registry,/powerhouse-runtime-scheduler-mux-v1/);
});

test('new intelligence tables are RLS protected and browser roles receive no grants',async()=>{
  const sql=await read('supabase/migrations/20261007204500_source_universe_impact_engine_v1.sql');
  for(const table of [
    'powerhouse_intelligence_domain_registry_v1',
    'powerhouse_intelligence_source_catalog_v1',
    'powerhouse_intelligence_signal_projection_v1',
    'powerhouse_intelligence_company_impact_v1',
    'powerhouse_intelligence_action_candidate_v1',
    'powerhouse_intelligence_snapshot_v1'
  ]){
    assert.ok(sql.includes(`alter table public.${table} enable row level security`),table);
    assert.ok(sql.includes(`revoke all on table public.${table} from public, anon, authenticated`),table);
  }
  assert.doesNotMatch(sql,/grant\s+(select|insert|update|delete|all).*\b(anon|authenticated)\b/i);
  assert.match(sql,/revoke all on function public\.powerhouse_refresh_external_intelligence_universe_v1\(text,integer\) from public,anon,authenticated/);
});

test('Portal V2 exposes the environmental radar through the existing authenticated data route',async()=>{
  const [registry,shell,module,api]=await Promise.all([
    read('portal-v2/page-registry.js'),
    read('portal-v2/page-shell.js'),
    read('portal-v2/modules/entrepreneur-intelligence.js'),
    read('netlify/functions/portal-ondernemersdata.mjs')
  ]);
  assert.match(registry,/omgevingsradar/);
  assert.match(shell,/omgevingsradar/);
  assert.match(module,/Source → evidence → signal → impact → actie → outcome → learning/);
  assert.match(module,/Nog niet bewezen · eigen bedrijfscontext nodig/);
  assert.match(api,/getUser\(request\)/);
  assert.match(api,/resolveIdentityTenant/);
  assert.match(api,/projectionScope/);
  assert.match(api,/powerhouse_intelligence_snapshot_v1/);
});

test('source universe UI and API JavaScript parse under Node',()=>{
  for(const path of [
    'portal-v2/modules/entrepreneur-intelligence.js',
    'portal-v2/page-registry.js',
    'portal-v2/page-shell.js',
    'netlify/functions/portal-ondernemersdata.mjs'
  ]){
    execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
  }
});

test('System Map, Brain learning and engineering skill inherit the truth contract',async()=>{
  const [map,learning,skill,doc,ledger]=await Promise.all([
    read('platform/system-map/canonical-system-map.mjs'),
    read('brain/learning/2026-10-07-source-universe-impact-engine-v1.json'),
    read('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md'),
    read('docs/source-universe-impact-engine-v1.md'),
    read('docs/development-ledger-events/2026-10-07-source-universe-impact-engine-v1.md')
  ]);
  for(const source of [map,learning,skill,doc])assert.match(source,/source-universe|Source Universe/i);
  assert.match(map,/financialValueNullUntilEvidenceBacked:true/);
  assert.match(skill,/Catalog ≠ connected/);
  assert.match(learning,/signal_score_is_not_impact_score/);
  assert.match(ledger,/protected merge/);
});
