import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const skill = readFileSync(new URL('../.agents/skills/powerhouse-self-improvement-layer/SKILL.md', import.meta.url), 'utf8');
const social = readFileSync(new URL('../.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md', import.meta.url), 'utf8');
const doc = readFileSync(new URL('../docs/changes/2026-10-29-powerhouse-runtime-proof-routing.md', import.meta.url), 'utf8');
const learning = JSON.parse(readFileSync(new URL('../brain/learning/2026-10-29-powerhouse-runtime-proof-routing-v1.json', import.meta.url), 'utf8'));

test('core agents require live source-of-truth reads and never infer business success from cron HTTP dispatch', () => {
  for (const source of ['powerhouse_one_brain_runtime_health_v1','powerhouse_loop_integrity_health_v1',
    'powerhouse_terminal_control_plane_health_v1','content_publication_obligations','powerhouse_runtime_events']) {
    assert.ok(skill.includes(source), source);
  }
  assert.match(skill, /cron\.job_run_details\.status=succeeded/);
  assert.match(skill, /not that the Edge function completed/);
  assert.match(skill, /AI_PUBLIC_MARKET_EVIDENCE_REQUIRED/);
  assert.match(skill, /zero current runtime errors/);
  assert.match(skill, /RESULT_UNKNOWN/);
});

test('social agents retain per-channel independent provider evidence and hard consent/identity gates', () => {
  for (const required of ['REVOKED_ACCESS_TOKEN','w_member_social','r_member_social','0.900','0.940','GENERATED','ACTIVE','NOT_PROVEN','provider create ID']) {
    assert.ok(social.includes(required), required);
  }
  assert.match(social, /original daily claim/);
  assert.match(social, /No new scheduler or second writer/);
  assert.match(social, /never disable the daily Heartbeat executor/);
});

test('Brain learning is an observed candidate, not fabricated runtime-wide green', () => {
  assert.equal(learning.fingerprint, 'powerhouse|runtime|cron-success-without-business-proof|20261029-v1');
  assert.equal(learning.maturity, 'OBSERVED');
  assert.equal(learning.evidence.runtime_green_proven, false);
  assert.equal(learning.evidence.no_new_scheduler, true);
  assert.ok(learning.evaluation.historical_replay.includes('tests/brain-powerhouse-runtime-truth-routing-20261029.test.mjs'));
  assert.match(doc, /32\/32/);
  assert.match(doc, /18\/18/);
  assert.match(doc, /2 runtimefouten/);
  assert.match(doc, /geen automatische .*GREEN/i);
});
