import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('global sentinel is deterministic, bounded and outcome-aware', async () => {
  const text = await readFile('docs/make/global-execution-obligation-sentinel.md', 'utf8');
  for (const token of ['BG165', 'BG156', 'BG168', 'schedule', 'last execution', 'required output', 'deterministic', 'bounded', 'domain adapter']) {
    assert.ok(text.includes(token), `missing ${token}`);
  }
  assert.match(text, /healthy[\s\S]{0,200}no paid AI/i);
  assert.match(text, /successful Make execution[\s\S]{0,200}not[\s\S]{0,200}business outcome/i);
});
