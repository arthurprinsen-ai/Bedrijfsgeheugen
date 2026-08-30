import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

const required = [
  ['NETLIFY_DEPLOY_INSTRUCTION_IS_NOT_EXECUTION', 'NETLIFY_DEPLOY_INSTRUCTION_IS_NOT_EXECUTION'],
  ['RUNTIME_DNS_FAILURE_IS_INFRA_BOUNDARY', 'RUNTIME_DNS_FAILURE_IS_INFRA_BOUNDARY'],
  ['PRODUCTION_PARITY_MISMATCH_REQUIRES_RECOVERY', 'PRODUCTION_PARITY_MISMATCH_REQUIRES_RECOVERY'],
];

test('latest tool-boundary lessons are mandatory preflight knowledge', async () => {
  const lessons = JSON.parse(await readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8'));
  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));
  const byId = new Map((lessons.lessons || []).map((lesson) => [lesson.id, lesson]));
  const active = new Set((rules.rules || []).filter((rule) => rule.active === true).map((rule) => rule.id));
  for (const [lessonId, ruleId] of required) {
    assert.ok(byId.has(lessonId), `missing tool-boundary lesson ${lessonId}`);
    assert.ok(active.has(ruleId), `missing active prevention rule ${ruleId}`);
  }
  const decision = await loadDeliveryPreflight({ component: 'shared' });
  const reused = new Set(decision.reusedLessons || []);
  for (const [lessonId] of required) assert.ok(reused.has(byId.get(lessonId).fingerprint), `preflight did not reuse ${lessonId}`);
});
