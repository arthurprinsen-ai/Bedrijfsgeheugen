import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');

test('canonical compare-slider runtime updates readable-side state while rendering', () => {
  const render = runtime.match(/function renderControlled\(raw\)\{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(render, /data-bg-readable-side/);
});
