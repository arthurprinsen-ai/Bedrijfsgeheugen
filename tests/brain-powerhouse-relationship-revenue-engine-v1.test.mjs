import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-28-powerhouse-relationship-revenue-engine-v1.json','utf8'));
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-revenue/SKILL.md','utf8');
const migration=fs.readFileSync('supabase/migrations/20260928103246_powerhouse_relationship_revenue_engine_v1.sql','utf8');
const auto=fs.readFileSync('supabase/migrations/20260928104500_powerhouse_relationship_research_auto_enrichment_v1.sql','utf8');

test('historical replay preserves Powerhouse-first commercial intelligence',()=>{
  assert.equal(learning.fingerprint,'powerhouse-relationship-revenue-engine-v1');
  assert.match(learning.root_cause,/first-party relationship graph/i);
  assert.ok(Array.isArray(learning.evidence) && learning.evidence.length>=4);
  assert.match(skill,/Powerhouse first-party/i);
  assert.match(skill,/Optionele vendor fallback.*Apollo/i);
  assert.match(migration,/apollo_required',false/);
});

test('historical replay preserves evidence-first automation and human outbound gate',()=>{
  assert.match(auto,/powerhouse_execute_relationship_research_v1/);
  assert.match(auto,/bg_bedrijfsnieuws/);
  assert.match(auto,/bg_externe_signalen/);
  assert.match(auto,/powerhouse_predictive_signals/);
  assert.match(auto,/vendor_used',false/);
  assert.match(auto,/external_outreach_executed',false/);
  assert.match(skill,/Ongevraagde externe outreach blijft human-authorized/i);
});


test('public research edge function is authenticated, evidence-only and feeds canonical trigger runtime',()=>{
  const fn=fs.readFileSync('supabase/functions/powerhouse-relationship-public-research/index.ts','utf8');
  assert.match(fn,/x-powerhouse-token/);
  assert.match(fn,/db\.rpc\('bg_geheim'/);
  assert.match(fn,/powerhouse_refresh_trigger_based_mkb_acquisition_v1/);
  assert.match(fn,/vendor_enrichment:false/);
  assert.match(fn,/external_outreach_executed:false/);
  assert.doesNotMatch(fn,/linkedin_dm|send.*message|email.*send/i);
});
