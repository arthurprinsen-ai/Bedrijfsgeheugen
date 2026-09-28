import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928103246_powerhouse_relationship_revenue_engine_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-revenue/SKILL.md','utf8');
const autoResearch=fs.readFileSync('supabase/migrations/20260928104333_powerhouse_relationship_research_auto_enrichment_v1.sql','utf8');
const dispatch=fs.readFileSync('supabase/migrations/20260928105310_powerhouse_relationship_public_research_dispatch_v1.sql','utf8');
const worker=fs.readFileSync('supabase/functions/powerhouse-relationship-public-research/index.ts','utf8');
const triggerSkill=fs.readFileSync('.agents/skills/trigger-based-mkb-acquisition/SKILL.md','utf8');
const quality=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8'));

test('relationship revenue engine is Powerhouse-first and vendor-optional',()=>{
  assert.match(migration,/powerhouse_relationship_revenue_intelligence_v1/);
  assert.match(migration,/powerhouse_refresh_relationship_revenue_v1/);
  assert.match(migration,/apollo_required',false/);
  assert.match(migration,/powerhouse_first_party/);
  assert.match(migration,/public_web/);
  assert.match(migration,/optional_vendor_fallback/);
  assert.match(skill,/Powerhouse first-party/i);
  assert.match(skill,/vendor.*optional/i);
});

test('relationship warmth never fabricates a buying trigger or sends unsolicited outbound',()=>{
  assert.match(migration,/relationship strength is not a buying trigger/i);
  assert.match(migration,/research_enrichment','internal/);
  assert.match(migration,/external_side_effect_allowed',false/);
  assert.match(migration,/unsolicited_outreach_requires_human_authorization',true/);
  assert.match(migration,/commercial_outreach_review','internal/);
  assert.match(migration,/human_authorization_required',true/);
  assert.match(triggerSkill,/gewone connection\/relationship activation is geen kooptrigger/i);
});

test('engine reuses existing commercial cycle and creates no scheduler family',()=>{
  const relationAt=migration.indexOf('v_relationship:=public.powerhouse_refresh_relationship_revenue_v1');
  const triggerAt=migration.indexOf('v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1');
  const learningAt=migration.indexOf('v_learning:=public.powerhouse_commercial_learning_cycle_v1');
  assert.ok(relationAt>0 && triggerAt>relationAt && learningAt>triggerAt);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
});

test('new RPC is a required Powerhouse quality surface',()=>{
  const surface=quality.surfaces.find(x=>x.id==='rpc:powerhouse_refresh_relationship_revenue_v1');
  assert.ok(surface);
  assert.equal(surface.required,true);
  assert.equal(surface.evidence_contract,'tests/supabase-powerhouse-relationship-revenue-engine-v1.test.mjs');
});


test('relationship research is executed from canonical public evidence stores before trigger materialization',()=>{
  const auto=fs.readFileSync('supabase/migrations/20260928104500_powerhouse_relationship_research_auto_enrichment_v1.sql','utf8');
  assert.match(auto,/powerhouse_execute_relationship_research_v1/);
  assert.match(auto,/bg_bedrijfsnieuws/);
  assert.match(auto,/bg_externe_signalen/);
  assert.match(auto,/powerhouse_predictive_signals/);
  assert.match(auto,/vendor_used',false/);
  assert.match(auto,/external_outreach_executed',false/);
  const researchAt=auto.indexOf('v_research:=public.powerhouse_execute_relationship_research_v1');
  const triggerAt=auto.indexOf('v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1');
  assert.ok(researchAt>0 && triggerAt>researchAt);
});


test('selected relationships are autonomously researched through the existing commercial scheduler',()=>{
  assert.match(autoResearch,/powerhouse_execute_relationship_research_v1/);
  assert.match(dispatch,/powerhouse_dispatch_relationship_public_research_v1/);
  assert.match(dispatch,/powerhouse-relationship-public-research/);
  assert.doesNotMatch(dispatch,/cron\.schedule\s*\(/i);
  assert.match(worker,/DATAFORSEO_LOGIN/);
  assert.match(worker,/relationship_public_research_evidence/);
  assert.match(worker,/vendor_enrichment:false/);
  assert.match(worker,/external_outreach_executed:false/);
});
