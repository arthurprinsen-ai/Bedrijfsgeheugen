import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260917113000_resource_intelligence_tenant_portal_v1.sql';
const portalGateway='supabase/functions/portal-state-eu/index.ts';
const resourceIngest='supabase/functions/resource-usage-eu/index.ts';
const csrd='portal-v2/csrd-impact.js';
const sources='portal-v2/data-sources.js';
const config='config/powerhouse-resource-intelligence-v1.json';
const read=path=>{assert.ok(fs.existsSync(path),`missing ${path}`);return fs.readFileSync(path,'utf8')};

test('live resource ingest authority is repository-managed and preserves provider measurement provenance',()=>{
  const code=read(resourceIngest);
  assert.match(code,/brain_record_resource_usage/);
  assert.match(code,/measurement_class/);
  assert.match(code,/provider_model_id/);
  assert.match(code,/tenant_id/);
  assert.match(code,/x-bg-service-token/);
});

test('resource intelligence config names the production schema authorities and provider truth rules',()=>{
  const policy=JSON.parse(read(config));
  assert.equal(policy.canonical_usage_authority,'public.brain_budget_usage');
  assert.equal(policy.canonical_resource_authority,'public.powerhouse_resource_impact_v1');
  assert.equal(policy.canonical_business_value_authority,'public.powerhouse_action_business_value_v1');
  assert.equal(policy.canonical_resource_intelligence_authority,'public.powerhouse_resource_intelligence_daily_v1');
  assert.equal(policy.unknown_data_policy,'null_not_zero');
  assert.equal(policy.agent_decision_contract.never_infer_provider_cost_without_measured_or_verified_pricing_evidence,true);
  assert.ok(policy.provider_telemetry.openai_and_ai_providers);
  assert.ok(policy.provider_telemetry.netlify);
  assert.ok(policy.compliance.frameworks.EU_AI_ACT);
  assert.ok(policy.compliance.frameworks.NIS2_CBW);
  assert.ok(policy.compliance.frameworks.CSRD_ESRS);
});

test('resource intelligence tables carry explicit tenant isolation',()=>{
  const sql=read(migration);
  assert.match(sql,/powerhouse_compliance_evidence_v1[\s\S]*tenant_id/i);
  assert.match(sql,/powerhouse_optimization_candidate_v1[\s\S]*tenant_id/i);
  assert.match(sql,/create index[\s\S]*tenant_id/i);
  assert.match(sql,/tenant_ids\[1\]/i);
  assert.match(sql,/cardinality\(tenant_ids\)\s*=\s*1/i);
});

test('portal gateway returns only tenant-scoped resource, value, compliance and recommendation evidence',()=>{
  const code=read(portalGateway);
  assert.match(code,/powerhouse_resource_intelligence_daily_v1/);
  assert.match(code,/powerhouse_business_value_intelligence_v1/);
  assert.match(code,/powerhouse_compliance_evidence_v1/);
  assert.match(code,/powerhouse_resource_optimization_queue_v1/);
  assert.match(code,/\.eq\('tenant_id',tenantId\)/);
  assert.match(code,/\.contains\('tenant_ids',\[tenantId\]\)/);
  assert.match(code,/resource_intelligence/);
  assert.match(code,/compliance_evidence/);
  assert.match(code,/recommendations/);
});

test('real tenant context never falls back to fake sustainability metrics',()=>{
  const code=read(csrd);
  assert.match(code,/UNKNOWN_LIVE_IMPACT_SNAPSHOT/);
  assert.match(code,/onbekend/i);
  assert.match(code,/geen live meting/i);
  assert.match(code,/resource_intelligence/);
});

test('portal source registry exposes resource intelligence as a runtime source',()=>{
  const code=read(sources);
  assert.match(code,/resource-intelligence/);
  assert.match(code,/resourceBusinessValue/);
  assert.match(code,/brondekking/i);
});
