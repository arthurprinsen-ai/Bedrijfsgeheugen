import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../.github/workflows/unified-brain-delivery.yml', import.meta.url);

async function source() {
  return readFile(workflowUrl, 'utf8');
}

test('Unified Brain rechecks canonical admission before lanes and before handoff', async () => {
  const yaml = await source();
  const first = yaml.indexOf('admission-preflight:');
  const lanes = yaml.indexOf('\n  lanes:');
  const second = yaml.indexOf('admission-handoff:');
  const handoff = yaml.indexOf('\n  handoff:');
  assert.ok(first >= 0, 'missing admission-preflight job');
  assert.ok(second >= 0, 'missing admission-handoff job');
  assert.ok(first < lanes, 'admission-preflight must run before lanes');
  assert.ok(second < handoff, 'admission-handoff must run before handoff');
  assert.match(yaml, /uses:\s+\.\/\.github\/workflows\/powerhouse-delivery-hygiene\.yml/);
  assert.match(yaml, /needs:[^\n]*admission-preflight|needs:\s*\[[^\]]*admission-preflight/);
  assert.match(yaml, /needs:[^\n]*admission-handoff|needs:\s*\[[^\]]*admission-handoff/);
});
