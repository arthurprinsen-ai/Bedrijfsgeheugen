import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928173100_powerhouse_relationship_external_intelligence_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-external-intelligence/SKILL.md','utf8');

test('external updates project into canonical person-company-customer intelligence',()=>{
  assert.match(migration,/powerhouse_refresh_relationship_external_intelligence_v1/);
  assert.match(migration,/powerhouse_relationship_context_enriched_v1/);
  assert.match(migration,/person->company->customer->opportunity\/NBA/);
  assert.match(migration,/relationship_external_intelligence/);
  assert.match(skill,/Geen los nieuwsarchief als eindpunt/);
});

test('external evidence is not promoted to buying intent without gates',()=>{
  assert.match(migration,/external_signals_are_evidence_not_truth/);
  assert.match(migration,/sensitive_inference_allowed',false/);
  assert.match(skill,/Extern signaal is evidence, niet automatisch koopintentie/);
  assert.match(skill,/Geen gevoelige persoonsinferenties/);
});

test('existing commercial scheduler remains the single owner',()=>{
  const ext=migration.indexOf('v_external_intelligence:=public.powerhouse_refresh_relationship_external_intelligence_v1');
  const rel=migration.indexOf('v_relationship:=public.powerhouse_refresh_relationship_revenue_v1');
  assert.ok(ext>0 && rel>ext);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
});
