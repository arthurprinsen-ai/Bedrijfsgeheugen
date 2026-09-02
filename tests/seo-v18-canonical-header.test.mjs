import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('SEO validator compares pages against the canonical V18 bgkop navigation', async () => {
  const source = await readFile('.github/scripts/seocontrole.py', 'utf8');
  assert.match(source, /re\.search\(r'<nav class=\\"bgkop\\"\[\\s\\S\]\*\?<\\\/nav>'/);
  assert.doesNotMatch(source, /re\.search\(r'<header class=\\"v17-header\\"/);
});
