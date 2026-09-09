import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fixer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs','utf8');

test('final compare-slider owner renders the divider flush with both physical card edges', () => {
  assert.match(fixer, /data-bg-compare-slider[^\n]*::after/);
  assert.match(fixer, /data-bg-compare-endpoint=[\\"']start[\\"']/);
  assert.match(fixer, /data-bg-compare-endpoint=[\\"']end[\\"']/);
  assert.match(fixer, /translateX\(0\)/);
  assert.match(fixer, /translateX\(-100%\)/);
  assert.match(fixer, /removeAttribute\(['"]data-bg-pointer-owner-ready['"]\)/);
  assert.match(fixer, /cloneNode\(true\)/);
  assert.match(fixer, /window\.addEventListener\(['"]pointermove['"]/);
});
