import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('deployment capability recovery is a registered mandatory agent skill', () => {
  const agents = read('AGENTS.md');
  const skill = read('.agents/skills/deployment-capability-recovery/SKILL.md');
  assert.match(agents, /\.agents\/skills\/deployment-capability-recovery\/SKILL\.md/);
  for (const requirement of [
    'DELIVERY_CONTROL_PLANE_CAPABILITY_GAP',
    'BLOCKED_CONTROL_PLANE_CAPABILITY',
    'exact expected SHA',
    'published',
    'no authorized write path',
  ]) {
    assert.ok(skill.toLowerCase().includes(requirement.toLowerCase()), `Missing requirement: ${requirement}`);
  }
  assert.match(skill, /No second scheduler/i);
  assert.match(skill, /Required, CodeQL/i);
});
