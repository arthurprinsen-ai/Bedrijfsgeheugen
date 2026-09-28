import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-28-powerhouse-relationship-external-intelligence-v1.json','utf8'));
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-external-intelligence/SKILL.md','utf8');
const migration=fs.readFileSync('supabase/migrations/20260928173100_powerhouse_relationship_external_intelligence_v1.sql','utf8');

test('historical replay preserves relationship external intelligence contract',()=>{
  assert.equal(learning.fingerprint,'powerhouse-relationship-external-intelligence-v1');
  assert.equal(learning.failure_class,'COMMERCIAL_INTELLIGENCE');
  assert.match(skill,/person -> company -> customer -> opportunity\/NBA/);
  assert.match(migration,/external_signals_are_evidence_not_truth/);
  assert.match(migration,/sensitive_inference_allowed',false/);
});
