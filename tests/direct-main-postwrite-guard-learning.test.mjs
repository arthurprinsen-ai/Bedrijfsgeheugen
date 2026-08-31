import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('direct-main post-write detection is retained as reusable Brain knowledge', async () => {
  const lessons = JSON.parse(await readFile('brain/learning/current-execution-lessons-2026-08-31.json', 'utf8'));
  const ids = new Set(lessons.lessons.map((item) => item.id));
  for (const id of [
    'MAIN_PUSH_CI_IS_DETECTION_NOT_PREWRITE_PREVENTION',
    'UNPROTECTED_MAIN_DIRECT_WRITE_REQUIRES_RECOVERY'
  ]) assert.ok(ids.has(id), `missing Brain lesson ${id}`);

  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));
  const serialized = JSON.stringify(rules);
  assert.match(serialized, /MAIN_PUSH_CI_IS_DETECTION_NOT_PREWRITE_PREVENTION/);
  assert.match(serialized, /UNPROTECTED_MAIN_DIRECT_WRITE_REQUIRES_RECOVERY/);
});
