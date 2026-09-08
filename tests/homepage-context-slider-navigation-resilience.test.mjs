import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../tools/site-shell/homepage-context-slider-browser-check.mjs', import.meta.url), 'utf8');

test('homepage context slider browser check does not depend on networkidle', () => {
  assert.doesNotMatch(source, /page\.goto\([^\n]+waitUntil:\s*['"]networkidle['"]/);
  assert.match(source, /async function gotoWithRetry/);
  assert.match(source, /waitUntil:\s*['"]domcontentloaded['"]/);
  assert.match(source, /#compareSlider/);
});
