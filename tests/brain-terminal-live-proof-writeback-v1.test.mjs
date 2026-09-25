import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('terminal live proof requires durable canonical writeback', () => {
  const skill=fs.readFileSync('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md','utf8');
  const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-25-terminal-live-proof-writeback-v1.json','utf8'));
  assert.match(skill,/delivery\|terminal-live-proof-writeback\|v1/);
  for (const phrase of ['skill projection','Brain learning','development ledger','human-readable change documentation']) {
    assert.ok(skill.includes(phrase), 'skill must require '+phrase);
  }
  assert.equal(learning.fingerprint,'delivery|terminal-live-proof-writeback|v1');
  assert.ok(learning.prevention.some(x=>x.includes('chat-only')));
  assert.deepEqual(learning.skill_targets,['powerhouse-delivery-self-optimization']);
});
