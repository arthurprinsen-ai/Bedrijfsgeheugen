import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('resource intelligence migration enforces provenance, tenant scope and autonomous guardrails',()=>{
  const sql=read('supabase/migrations/20260917103000_powerhouse_resource_intelligence_control_plane_v1.sql');
  for(const marker of [
    'powerhouse_compliance_frameworks',
    'powerhouse_compliance_controls',
    'powerhouse_compliance_assessments',
    'powerhouse_compliance_readiness_v1',
    'powerhouse_resource_decision_gate_v1',
    'powerhouse_resource_intelligence_daily_v1',
    "Europe/Amsterdam",
    'MEASURED','PROVIDER_REPORTED','CALCULATED','MODELLED','ESTIMATED','UNKNOWN',
    'AUTO_ALLOWED','GOVERNED_OBLIGATION',
    'security_non_degradation','tenant_isolation_non_degradation'
  ]) assert.match(sql,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),marker);
  assert.doesNotMatch(sql,/water_liters\s*=\s*[0-9]/i,'migration must not invent water factors');
  assert.doesNotMatch(sql,/co2e_kg\s*=\s*[0-9]/i,'migration must not invent carbon factors');
});

test('agent contract makes Resource Intelligence mandatory for all material work',()=>{
  const contract=read('AGENTS.md');
  assert.match(contract,/Resource Intelligence hard gate/i);
  assert.match(contract,/no fake precision/i);
  assert.match(contract,/Pareto/i);
  assert.match(contract,/GOVERNED_OBLIGATION/);
});

test('Portal V2 exposes Resource Intelligence from real tenant state',()=>{
  const registry=read('portal-v2/page-registry.js');
  const pages=read('portal-v2/native-pages.js');
  const metrics=read('portal-v2/page-metrics.js');
  assert.match(registry,/resource-intelligence/);
  assert.match(pages,/resource-intelligence/);
  assert.match(metrics,/resourceBusinessValue/);
  assert.doesNotMatch(metrics,/12[,.]4 kWh|183 liter/i,'resource page must not ship fabricated resource values');
});
