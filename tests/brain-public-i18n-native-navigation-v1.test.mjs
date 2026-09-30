import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public locale anchors keep native navigation and mobile mount is parent-safe', async () => {
  const runtime = await readFile('assets/js/i18n.js','utf8');
  assert.match(runtime,/!isPortal\(\) && option\.tagName === 'A'/);
  assert.match(runtime,/event\.stopImmediatePropagation\(\)/);
  assert.doesNotMatch(runtime,/window\.location\.assign\(href\)/);
  assert.match(runtime,/node && node\.parentNode === mobileHost/);
});

test('i18n asset version changes with runtime navigation fix', async () => {
  const build = await readFile('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(build,/cms-i18n-20260930-3/);
});
