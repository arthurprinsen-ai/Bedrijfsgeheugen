import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const finalizer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs','utf8');

test('mobile slider remains the full-card drag hit area at both endpoints', () => {
  assert.match(finalizer, /\[data-bg-compare-slider\]\{[^}]*touch-action:pan-y[^}]*cursor:ew-resize/);
  assert.match(finalizer, /\[data-bg-compare-slider\]\s+\.compare-handle\{[^}]*pointer-events:none!important/);
  assert.match(finalizer, /\[data-bg-compare-slider\]\s+\.compare-knob\{pointer-events:none!important\}/);
});
