import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../.github/workflows/unified-brain-delivery.yml', import.meta.url);

async function source() {
  return readFile(workflowUrl, 'utf8');
}

test('Unified Brain rechecks canonical admission before lanes and before handoff', async () => {
  const yaml = await source();
  const first = yaml.indexOf('\n  admission:');
  const plan = yaml.indexOf('\n  plan:');
  const lanes = yaml.indexOf('\n  lanes:');
  const second = yaml.indexOf('\n  pre-handoff-admission:');
  const handoff = yaml.indexOf('\n  handoff:');
  assert.ok(first >= 0, 'missing initial admission job');
  assert.ok(second >= 0, 'missing pre-handoff admission job');
  assert.ok(first < plan && plan < lanes, 'initial admission must gate planning before lanes');
  assert.ok(second > lanes && second < handoff, 'second admission must run after lanes and before handoff');
  assert.match(yaml, /uses:\s+\.\/\.github\/workflows\/powerhouse-delivery-hygiene\.yml/);
  assert.match(yaml, /plan:\s*\n\s+needs:\s+\[candidate-identity, admission\]/m);
  assert.match(yaml, /handoff:\s*\n\s+needs:\s+\[plan, lanes, pre-handoff-admission\]/m);
  assert.match(yaml, /needs\.pre-handoff-admission\.outputs\.admitted == 'true'/);
});
