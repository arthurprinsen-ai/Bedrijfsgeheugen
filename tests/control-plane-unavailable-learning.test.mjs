import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shard = JSON.parse(fs.readFileSync('config/chat-learning/2026-08-30-control-plane-unavailable.json', 'utf8'));
const rules = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));

test('control-plane unavailable outcome is durably learned and governed', () => {
  const lesson = (shard.lessons || []).find((item) => item.id === 'CONTROL_PLANE_UNAVAILABLE_PRESERVE_CANDIDATE');
  assert.ok(lesson);
  assert.equal(lesson.preventionRule, 'PRESERVE_GREEN_CANDIDATE_WHEN_PRODUCTION_AUTHORITY_UNAVAILABLE');
  assert.match(lesson.requiredAction, /dezelfde.*SHA|same.*SHA/i);
  assert.match(lesson.prevention, /niet omzeilen|not bypass/i);
  assert.match(lesson.prevention, /drift.*geen blocker|drift.*not.*blocker/i);
  const rule = (rules.rules || []).find((item) => item.id === lesson.preventionRule);
  assert.ok(rule && rule.active === true);
});
