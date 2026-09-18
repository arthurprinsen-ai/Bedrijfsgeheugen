import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const fingerprint = 'delivery|merge-epoch|optimistic-cas|v1';

test('merge-epoch learning is projected to canonical skills and documentation', async () => {
  const [learningRaw, brainSkillRaw, agentSkill, continuity, ledger, docs] = await Promise.all([
    read('brain/learning/2026-09-18-merge-epoch-concurrency-guard-v1.json'),
    read('brain/skills/powerhouse-delivery-concurrency-v1.json'),
    read('.agents/skills/powerhouse-delivery-concurrency/SKILL.md'),
    read('.agents/skills/powerhouse-continuity/SKILL.md'),
    read('brain/learning-ledger/2026-09-18-merge-epoch-concurrency-guard-v1.md'),
    read('docs/brain/merge-epoch-concurrency-guard-v1.md')
  ]);

  const learning = JSON.parse(learningRaw);
  const brainSkill = JSON.parse(brainSkillRaw);

  assert.equal(learning.fingerprint, fingerprint);
  assert.equal(learning.status, 'ACTIVE_PREVENTION_PROVEN');
  assert.equal(learning.production_proof.merge_sha, 'fa0de9e319bc0fb440d0dd342d9688d49ed5414c');
  assert.equal(learning.production_proof.main_readback, 'verified');

  assert.equal(brainSkill.fingerprint, fingerprint);
  assert.equal(brainSkill.status, 'ACTIVE');
  assert.equal(brainSkill.canonical_evidence.production_state, 'LIVE_AND_PROVEN');

  for (const surface of [agentSkill, continuity, ledger, docs]) {
    assert.ok(surface.includes(fingerprint), 'surface must expose canonical fingerprint');
  }

  assert.ok(continuity.includes('.agents/skills/powerhouse-delivery-concurrency/SKILL.md'));
  assert.ok(ledger.includes('PR #2092'));
  assert.ok(docs.includes('PR #2074'));
});
