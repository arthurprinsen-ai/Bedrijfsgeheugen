import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('standalone visibility gate bounds every async layer', async () => {
  const source = await readFile('tools/site-shell/standalone-visibility-check.mjs', 'utf8');
  assert.match(source, /UI_VR_NAVIGATION_TIMEOUT_MS/);
  assert.match(source, /UI_VR_FONT_READY_TIMEOUT_MS/);
  assert.match(source, /UI_VR_TOTAL_BUDGET_MS/);
  assert.match(source, /Promise\.race\(\[/);
  assert.match(source, /document\.fonts\.ready/);
  assert.match(source, /AbortSignal\.timeout\(navigationTimeoutMs\)/);
  assert.match(source, /Visibility sweep exceeded bounded budget/);
  assert.doesNotMatch(source, /for \(let attempt = 1; attempt <= 4; attempt\+\+\)/);
});
