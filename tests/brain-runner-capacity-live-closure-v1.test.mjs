import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learning = JSON.parse(fs.readFileSync(new URL('../brain/learning/2026-09-18-runner-capacity-live-closure-v1.json', import.meta.url), 'utf8'));
const skill = fs.readFileSync(new URL('../.agents/skills/powerhouse-continuity/SKILL.md', import.meta.url), 'utf8');

test('runner capacity recovery closure is terminally proven and projected', () => {
  assert.equal(learning.status, 'LIVE_BEWEZEN');
  assert.equal(learning.merge_sha, '95ea2a673c8a3f801aea77cf8b3a81ae1232aea9');
  assert.equal(learning.production.commit_ref, learning.merge_sha);
  for (const rule of [
    'VALIDATE_RECOVERY_METADATA_BEFORE_EXPENSIVE_CI',
    'RECONCILE_MOVED_MAIN_USING_FULL_MAIN_UNION',
    'PRESERVE_EXISTING_LEARNING_AND_REGRESSIONS_DURING_RECOVERY',
    'REQUIRE_EXACT_PRODUCTION_COMMIT_READBACK_BEFORE_LIVE_BEWEZEN'
  ]) assert.ok(learning.prevention.includes(rule));
  assert.ok(skill.includes('delivery|runner-capacity|live-closure|v1'));
});
