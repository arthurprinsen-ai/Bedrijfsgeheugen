import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixer = await readFile(new URL('../tools/site-shell/fix-homepage-context-slider.mjs', import.meta.url), 'utf8');

test('mobiele native range compenseert iOS thumb-inset zodat 0 en 100 fysiek aan de kaartrand bereikbaar zijn', () => {
  assert.match(fixer, /@media\(max-width:720px\)[\s\S]*\.bg-compare-range\{[^}]*left:-28px!important[^}]*right:-28px!important[^}]*width:calc\(100% \+ 56px\)!important/s);
  assert.match(fixer, /\[data-bg-compare-slider\]\{[^}]*overflow:hidden!important/s);
});
