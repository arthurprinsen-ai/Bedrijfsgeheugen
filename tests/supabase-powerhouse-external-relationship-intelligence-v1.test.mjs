import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928153000_powerhouse_external_relationship_intelligence_v1.sql','utf8');
const relationSkill=fs.readFileSync('.agents/skills/powerhouse-relationship-revenue/SKILL.md','utf8');
const linkedinSkill=fs.readFileSync('.agents/skills/powerhouse-linkedin-sales-machine/SKILL.md','utf8');
const systemMap=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('verified external evidence becomes canonical relationship intelligence',()=>{
  assert.match(migration,/powerhouse_relationship_external_intelligence_v1/);
  assert.match(migration,/powerhouse_project_external_relationship_intelligence_v1/);
  assert.match(migration,/powerhouse_predictive_signals/);
  assert.match(migration,/bg_connecties/);
  assert.match(migration,/powerhouse_customer_external_intelligence_v1/);
});

test('external intelligence runs before downstream commercial scoring',()=>{
  const externalAt=migration.indexOf('v_external_relationship_intelligence:=public.powerhouse_project_external_relationship_intelligence_v1');
  const relationAt=migration.indexOf('v_relationship:=public.powerhouse_refresh_relationship_revenue_v1');
  const triggerAt=migration.indexOf('v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1');
  assert.ok(externalAt>0 && relationAt>externalAt && triggerAt>relationAt);
});

test('LinkedIn is evidence input, not automatic buying proof',()=>{
  assert.match(migration,/linkedin/);
  assert.match(migration,/linkedin_is_signal_not_buying_proof/);
  assert.match(relationSkill,/LinkedIn.*signaal/i);
  assert.match(linkedinSkill,/profielcontext/i);
});

test('system map registers the capability without a parallel CRM',()=>{
  assert.match(systemMap,/external-relationship-intelligence/);
  assert.match(systemMap,/connection.*company.*customer/i);
  assert.match(migration,/no_parallel_crm',true/);
});
