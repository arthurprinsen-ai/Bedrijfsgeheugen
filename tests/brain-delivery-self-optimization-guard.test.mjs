import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p, root), 'utf8');
const fp = 'delivery|first-time-right|terminal-preflight|v1';

test('delivery self-optimization learning is projected into both delivery skills', async () => {
  const [learningRaw, agentSkill, brainSkillRaw, ledger, docs] = await Promise.all([
    read('brain/learning/2026-09-18-delivery-self-optimization-v1.json'),
    read('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md'),
    read('brain/skills/powerhouse-delivery-self-optimization-v1.json'),
    read('brain/learning-ledger/2026-09-18-delivery-self-optimization-v1.md'),
    read('docs/brain/delivery-self-optimization-v1.md')
  ]);
  const learning = JSON.parse(learningRaw);
  const brainSkill = JSON.parse(brainSkillRaw);

  assert.equal(learning.fingerprint, fp);
  assert.equal(brainSkill.fingerprint, fp);
  assert.equal(brainSkill.optimization_fingerprint, fp);
  for (const surface of [agentSkill, ledger, docs]) assert.ok(surface.includes(fp));

  assert.ok(agentSkill.includes('Anticipate-before-act'));
  assert.ok(agentSkill.includes('scheduler/concurrency recovery'));
  assert.ok(agentSkill.includes('workflow/classifier coverage'));
  assert.ok(agentSkill.includes('re-plan'));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('Refresh authoritative')));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('Forecast the next likely invalidation')));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('PR metadata')));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('workflow/classifier coverage')));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('cancelled GitHub jobs')));
  assert.ok(brainSkill.required_behavior.some(x => x.includes('terminal path')));
  assert.ok(learning.prevention.some(x => x.startsWith('ANTICIPATE_BEFORE_ACT:')));
  assert.ok(learning.prevention.some(x => x.startsWith('NO_CACHED_IRREVERSIBLE_ACTION:')));
  assert.ok(learning.prevention.some(x => x.startsWith('CALIBRATE_FAILURE_FORECAST:')));
  assert.ok(learning.optimization_metrics.includes('forecast_miss_count'));
  assert.ok(docs.includes('failure forecast'));
  assert.ok(docs.includes('Terminal-path preflight'));
});
