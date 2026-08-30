import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');

test('successful customer authentication opens the legacy portal after storing the offer', () => {
  assert.match(html, /bewaar\(s, k, sessie\.access_token\);\s*toonPortaal\(\{email:mail\}\);/);
  assert.doesNotMatch(html, /bewaar\(s, k, sessie\.access_token\);\s*\}\);\s*\}\)\s*\.then\(function \(\) \{ location\.reload\(\); \}\)/);
});
