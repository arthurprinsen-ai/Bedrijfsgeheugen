import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRAND_SHELL_CSS } from '../tools/site-shell/components.mjs';

const css = BRAND_SHELL_CSS;
const runtime = readFileSync(new URL('../assets/mobile-viewport-cleanup.js', import.meta.url), 'utf8');
const builder = readFileSync(new URL('../tools/site-shell/apply-cms-runtime.mjs', import.meta.url), 'utf8');

test('mobile header has one compact navigational control and no trustbar overflow', () => {
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /\.bg-uniform-trust,\.bgtop,\.announcement\{display:none!important\}/);
  assert.match(css, /header\.v17-header \.v17-nav>\.mobile-toggle::after\{content:"Menu"/);
  assert.match(css, /header\.v17-header \.v17-nav>\.brand>:first-child:not\(:last-child\)\{display:none!important\}/);
  assert.match(css, /header\.v17-header \.v17-nav>\.mobile-toggle\[aria-expanded="true"\]::after\{content:"Sluit"/);
});

test('daily steering H1 and yellow highlight cannot overlap on phones', () => {
  assert.match(css, /main \[data-bg-daily-steering-title="v2"\]/);
  assert.match(css, /\[data-bg-daily-steering-title="v2"\] \.mark\{display:inline!important;background:transparent!important/);
});

test('public pages load first-screen cleanup from final Netlify stage', () => {
  assert.match(builder, /mobile-viewport-cleanup\.js/);
  assert.match(builder, /data-bg-mobile-fix/);
  assert.match(runtime, /Sinds je deze pagina opende/);
  assert.match(runtime, /getComputedStyle\(node\)\.position/);
  assert.doesNotThrow(() => new Function(runtime));
});
