import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/site-coherence-v1.css', import.meta.url), 'utf8');
const build = readFileSync(new URL('../tools/site-shell/finalize-website-coherence-v1.mjs', import.meta.url), 'utf8');

test('production v18 mobile header has only the real navigation trigger', () => {
  assert.match(css, /Mobile first-fold correction — 2026-10-15/);
  assert.match(css, /\.v17-header \.brand > \.mark\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.v17-header \.mobile-toggle\s*\{/);
  assert.match(css, /\.bg-uniform-trust\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /min-height:\s*48px\s*!important/);
});

test('mobile hero has bounded title and non-obscuring emphasis', () => {
  assert.match(css, /h1\[data-bg-daily-steering-title\]/);
  assert.match(css, /font-size:\s*clamp\(30px,\s*8vw,\s*42px\)\s*!important/);
  assert.match(css, /h1\[data-bg-daily-steering-title\] \.mark\s*\{/);
  assert.match(css, /background:\s*none\s*!important/);
  assert.match(css, /\.inhoud-kop h1\s*\{/);
});

test('the timed promotional popup never covers mobile page content', () => {
  assert.match(css, /\.bgx-lek,\s*\.bgx-lek\.bgx-aan\s*\{\s*display:\s*none\s*!important/);
});

test('generated website references the versioned shared style asset', () => {
  assert.match(build, /site-coherence-v1\.css\?v=20261015-mobile1/);
});
