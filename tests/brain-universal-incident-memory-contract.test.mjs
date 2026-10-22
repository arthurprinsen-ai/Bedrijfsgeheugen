import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(p,'utf8');
const tag = 'powerhouse|incident-learning|fingerprint-preflight-recurrence-prevention|20261022-v1';

test('universal incident learning is registered in shared agent instruction and existing continuity skill', () => {
  const agents = read('AGENTS.md');
  const skill = read('.agents/skills/powerhouse-continuity/SKILL.md');
  assert.match(agents, /Universele incidentleerpoort/);
  assert.ok(agents.includes(tag));
  assert.ok(skill.includes(tag));
  for(const invariant of ['public.brain_failure_registry','brain/learning','occurrence','PROVEN','regressie','skillprojectie','stream']){
    assert.ok((agents+'\n'+skill).toLowerCase().includes(invariant.toLowerCase()), invariant);
  }
  assert.match(skill, /CI_ZERO_JOB_ACTION_REQUIRED/);
  assert.match(skill, /SQL_ARCHIVE_ORACLE_DRIFT/);
  assert.match(skill, /SCHEDULER_UNREACHABLE_BRANCH/);
  assert.match(skill, /SOCIAL_PROVIDER_DELIVERY_GAP/);
  assert.match(skill, /TOOL_OR_STREAM_INTERRUPTION/);
});

test('canonical machine learning has a semantic, reproducible prevention contract and no separate store', () => {
  const entry=JSON.parse(read('brain/learning/2026-10-22-universal-incident-reuse-prevention-v1.json'));
  assert.equal(entry.fingerprint,tag);
  assert.equal(entry.status,'CANDIDATE');
  assert.equal(entry.compiler.failure_class,'GOVERNANCE');
  assert.ok(entry.root_cause.length>40);
  assert.ok(entry.prevention_rule.length>100);
  assert.ok(entry.evaluation.historical_replay.includes('tests/brain-universal-incident-memory-contract.test.mjs'));
  assert.ok(entry.skill_targets.includes('continuity'));
  const docs=read('docs/learning/2026-10-22-universal-incident-reuse-prevention-v1.md');
  assert.match(docs,/geen nieuwe opslag/i);
  assert.match(docs,/ACCEPTANCE_PENDING/);
});
