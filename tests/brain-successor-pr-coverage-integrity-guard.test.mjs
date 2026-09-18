import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const fingerprint = 'delivery|successor-pr|coverage-integrity|v1';

test('successor PR coverage integrity learning is projected to durable delivery skills', async () => {
  const [learningRaw, ledger, docs, deliverySkill, continuity, brainSkillRaw, backendWorkflow] = await Promise.all([
    read('brain/learning/2026-09-18-successor-pr-coverage-integrity-v1.json'),
    read('brain/learning-ledger/2026-09-18-successor-pr-coverage-integrity-v1.md'),
    read('docs/brain/successor-pr-coverage-integrity-v1.md'),
    read('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md'),
    read('.agents/skills/powerhouse-continuity/SKILL.md'),
    read('brain/skills/powerhouse-delivery-self-optimization-v1.json'),
    read('.github/workflows/lane-backend.yml')
  ]);

  const learning = JSON.parse(learningRaw);
  const brainSkill = JSON.parse(brainSkillRaw);

  assert.equal(learning.fingerprint, fingerprint);
  assert.equal(learning.status, 'ACTIVE_PREVENTION_PROVEN');
  assert.equal(learning.production_proof.recovery_pr, 2158);
  assert.equal(learning.production_proof.production_readback, 'success');

  for (const surface of [ledger, docs, deliverySkill, continuity]) {
    assert.ok(surface.includes(fingerprint), 'surface must expose canonical successor coverage fingerprint');
  }

  assert.ok(brainSkill.secondary_fingerprints.includes(fingerprint));
  assert.ok(brainSkill.required_behavior.some(rule => /successor/i.test(rule) && /coverage/i.test(rule)));
  assert.ok(backendWorkflow.includes('tests/supabase-instagram-media-job-materializer-v1.test.mjs'));
});
