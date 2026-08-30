import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shard = JSON.parse(fs.readFileSync('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8'));
const rules = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));

test('control-plane unavailable outcome is durably learned and governed', () => {
  const lesson = (shard.lessons || []).find((item) => item.id === 'CONTROL_PLANE_UNAVAILABLE_PRESERVE_CANDIDATE');
  assert.ok(lesson, 'missing CONTROL_PLANE_UNAVAILABLE_PRESERVE_CANDIDATE');
  assert.equal(lesson.preventionRule, 'PRESERVE_GREEN_CANDIDATE_WHEN_PRODUCTION_AUTHORITY_UNAVAILABLE');
  assert.match(lesson.fingerprint, /control-plane-unavailable/i);
  assert.match(lesson.requiredAction, /same|dezelfde/i);
  assert.match(lesson.requiredAction, /SHA/i);
  assert.match(lesson.prevention, /niet omzeilen|not bypass/i);
  assert.match(lesson.prevention, /overlap|conflict/i);
  const rule = (rules.rules || []).find((item) => item.id === lesson.preventionRule);
  assert.ok(rule && rule.active === true, 'missing active prevention rule for control-plane unavailable learning');
});
