import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const learningPath = new URL('../brain/learning/chat-runtime-truth-lessons-2026-08-31.json', import.meta.url);

const requiredFingerprints = [
  'github|pr-terminal-state|stale-conversation-snapshot-v1',
  'github|git-data|connector-schema-mismatch-before-mutation-v1',
  'delivery|green-candidate|parallel-main-semantic-duplicate-v1'
];

test('material runtime-truth learnings from chat are committed to canonical Brain memory', () => {
  assert.equal(
    existsSync(learningPath),
    true,
    'canonical Brain learning record for current chat runtime-truth lessons is missing'
  );

  const record = JSON.parse(readFileSync(learningPath, 'utf8'));
  const lessons = Array.isArray(record.lessons) ? record.lessons : [];
  const fingerprints = new Set(lessons.map((lesson) => lesson.fingerprint));

  for (const fingerprint of requiredFingerprints) {
    assert.equal(fingerprints.has(fingerprint), true, `missing durable fingerprint: ${fingerprint}`);
  }

  for (const lesson of lessons.filter((item) => requiredFingerprints.includes(item.fingerprint))) {
    assert.equal(lesson.status, 'PROVEN');
    assert.ok(lesson.rootCause);
    assert.ok(lesson.prevention);
    assert.ok(lesson.regressionContract);
    assert.equal(lesson.security?.contains_secrets, false);
    assert.equal(lesson.security?.contains_credentials, false);
    assert.equal(lesson.security?.contains_pii, false);
  }
});
