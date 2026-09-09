import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');
const fixer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs','utf8');
const headers = fs.readFileSync('_headers','utf8');
const versionedRuntimePath = 'assets/compare-slider-runtime-native-range-v13.js';

test('canonical compare slider is owned by one native full-range input', () => {
  assert.match(runtime, /bg-compare-range/);
  assert.match(runtime, /\.type\s*=\s*['"]range['"]/);
  assert.match(runtime, /\.min\s*=\s*['"]0['"]/);
  assert.match(runtime, /\.max\s*=\s*['"]100['"]/);
  assert.match(runtime, /\.step\s*=\s*['"]1['"]/);
  assert.match(runtime, /addEventListener\(['"]input['"]/);
  assert.match(runtime, /addEventListener\(['"]change['"]/);
  assert.doesNotMatch(runtime, /addEventListener\(['"]touch(?:start|move|end)['"]/);
  assert.doesNotMatch(runtime, /addEventListener\(['"]pointer(?:down|move|up)['"]/);
  assert.doesNotMatch(runtime, /setPointerCapture|releasePointerCapture/);
  assert.doesNotMatch(runtime, /window\.addEventListener\(['"]pointer(?:move|up)['"]/);
});

test('native compare value directly renders both physical endpoints', () => {
  assert.match(runtime, /data-bg-compare-endpoint/);
  assert.match(runtime, /value\s*===\s*0\s*\?\s*['"]start['"]/);
  assert.match(runtime, /value\s*===\s*100\s*\?\s*['"]end['"]/);
  assert.match(runtime, /bg-compare-divider/);
  assert.match(runtime, /slider\.style\.setProperty\(['"]--bg-compare-split['"],\s*pct/);
  assert.match(runtime, /range\.value\s*=\s*String\(Math\.round\(value\)\)/);
});

test('homepage shell fixer injects only the canonical runtime and no second drag owner', () => {
  assert.match(fixer, /\/assets\/compare-slider-runtime-native-range-v13\.js/);
  assert.doesNotMatch(fixer, /const RUNTIME_SRC = ['"]\/assets\/compare-slider-runtime\.js['"]/);
  assert.doesNotMatch(fixer, /FALLBACK_TAG/);
  assert.doesNotMatch(fixer, /data-bg-context-slider-aria-fallback/);
  assert.doesNotMatch(fixer, /setPointerCapture|releasePointerCapture/);
  assert.doesNotMatch(fixer, /addEventListener\(['"]pointer(?:down|move|up)['"]/);
  assert.doesNotMatch(fixer, /addEventListener\(['"]touch(?:start|move|end)['"]/);
});

test('immutable asset caching cannot pin an older compare runtime on iPhone', () => {
  assert.match(headers, /\/assets\/\*[^]*max-age=31536000, immutable/);
  assert.ok(fs.existsSync(versionedRuntimePath), 'versioned compare runtime asset must exist');
  const versionedRuntime = fs.readFileSync(versionedRuntimePath, 'utf8');
  assert.equal(versionedRuntime, runtime);
});
