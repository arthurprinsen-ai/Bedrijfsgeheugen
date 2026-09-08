import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');

test('mobiele compare-slider laat geen tekstkolom van enkele woorden ontstaan in een smalle minderheidshelft', () => {
  assert.match(fixer, /data-bg-readable-side/);
  assert.match(fixer, /v>=50\?'before':'after'/);
  assert.match(fixer, /\[data-bg-readable-side="before"\]\s+\.compare-after\s+\.compare-copy\{[^}]*opacity:0!important[^}]*visibility:hidden!important/s);
  assert.match(fixer, /\[data-bg-readable-side="after"\]\s+\.compare-before\s+\.compare-copy\{[^}]*opacity:0!important[^}]*visibility:hidden!important/s);
  assert.match(fixer, /matchMedia\('\(max-width:720px\)'\).*Number\(g\.value\)<50\?0:100/s);
});
