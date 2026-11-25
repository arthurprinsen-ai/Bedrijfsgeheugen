import test from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_SHELL_CSS } from '../tools/site-shell/components.mjs';
import { readFileSync } from 'node:fs';

test('historical mobile first-screen regression: compact canonical header', () => {
  assert.match(BRAND_SHELL_CSS, /header\.v17-header \.v17-nav>\.mobile-toggle::after\{content:"Menu"/);
  assert.match(BRAND_SHELL_CSS, /\.bg-uniform-trust,\.bgtop,\.announcement\{display:none!important\}/);
});

test('historical hero regression: no mobile highlight box collisions', () => {
  assert.match(BRAND_SHELL_CSS, /main \[data-bg-daily-steering-title="v2"\] \.mark\{display:inline!important;background:transparent!important/);
});

test('historical bottom-popup regression: cleanup deployed on every public page', () => {
  const stage = readFileSync(new URL('../tools/site-shell/apply-cms-runtime.mjs',import.meta.url),'utf8');
  const cleanup = readFileSync(new URL('../assets/mobile-viewport-cleanup.js',import.meta.url),'utf8');
  assert.match(stage,/mobile-viewport-cleanup\.js/);
  assert.match(cleanup,/Sinds je deze pagina opende/);
  assert.doesNotThrow(()=>new Function(cleanup));
});
