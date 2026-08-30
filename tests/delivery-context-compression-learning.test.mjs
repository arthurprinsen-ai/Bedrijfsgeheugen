import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = new Map([
  ['KNOWN_FIX_SURVIVES_CONTEXT_COMPRESSION', ['knowledge-preflight-context-compression-v1', 'PRESERVE_EXECUTABLE_KNOWN_FIX_IN_CONTEXT']],
  ['LEARNING_WRITEBACK_FAILS_OPEN_TO_PRIMARY_WORK', ['learning-router|bg168|central-fail-open|2026-08-30-v1', 'LEARNING_WRITEBACK_FAIL_OPEN_TO_PRIMARY_WORK']]
]);

test('runtime-proven context safety lessons remain durable and actively prevented', async () => {
  const lessons = JSON.parse(await readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8'));
  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));
  const byId = new Map(lessons.lessons.map((lesson) => [lesson.id, lesson]));
  const activeRules = new Set(rules.rules.filter((rule) => rule.active === true).map((rule) => rule.id));
  for (const [id, [fingerprint, preventionRule]] of required) {
    const lesson = byId.get(id);
    assert.ok(lesson, `missing durable runtime lesson ${id}`);
    assert.equal(lesson.fingerprint, fingerprint);
    assert.equal(lesson.preventionRule, preventionRule);
    for (const field of ['symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${id}.${field} must be machine-readable`);
      assert.ok(lesson[field].trim(), `${id}.${field} must not be empty`);
    }
    assert.ok(activeRules.has(preventionRule), `${id} prevention must be active`);
  }
});
