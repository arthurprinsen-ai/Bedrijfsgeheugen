import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = new Map([
  ['knowledge-preflight-context-compression-v1', 'PRESERVE_EXECUTABLE_KNOWN_FIX_IN_CONTEXT'],
  ['learning-router|bg168|central-fail-open|2026-08-30-v1', 'LEARNING_WRITEBACK_FAIL_OPEN_TO_PRIMARY_WORK']
]);

test('runtime-proven context learnings are durable and actively prevented on current main', async () => {
  const lessons = JSON.parse(await readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8')).lessons;
  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8')).rules;
  const active = new Set(rules.filter(rule => rule.active === true).map(rule => rule.id));

  for (const [fingerprint, preventionRule] of required) {
    const lesson = lessons.find(item => item.fingerprint === fingerprint);
    assert.ok(lesson, `missing runtime learning ${fingerprint}`);
    assert.equal(lesson.preventionRule, preventionRule);
    for (const field of ['symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.ok(String(lesson[field] || '').trim(), `${fingerprint}.${field} missing`);
    }
    assert.ok(active.has(preventionRule), `missing active prevention ${preventionRule}`);
  }
});
