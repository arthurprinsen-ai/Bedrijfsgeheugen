import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p, root), 'utf8');
const fp = 'delivery|capacity-owner-authority|v1';

test('capacity and owner-head learning is projected into delivery optimization skills', async () => {
  const [learningRaw, agentSkill, brainSkillRaw, ledger, docs] = await Promise.all([
    read('brain/learning/2026-09-18-delivery-capacity-owner-authority-v1.json'),
    read('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md'),
    read('brain/skills/powerhouse-delivery-self-optimization-v1.json'),
    read('brain/learning-ledger/2026-09-18-delivery-capacity-owner-authority-v1.md'),
    read('docs/brain/delivery-capacity-owner-authority-v1.md')
  ]);
  const learning = JSON.parse(learningRaw);
  const brainSkill = JSON.parse(brainSkillRaw);

  assert.equal(learning.fingerprint, fp);
  assert.ok(agentSkill.includes(fp));
  assert.ok(brainSkill.secondary_fingerprints.includes(fp));
  assert.ok(ledger.includes('WAITING_CAPACITY'));
  assert.ok(docs.includes('newest owner head') || docs.includes('nieuwste owner head'));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('WAITING_CAPACITY')));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('newest owner head')));
});
