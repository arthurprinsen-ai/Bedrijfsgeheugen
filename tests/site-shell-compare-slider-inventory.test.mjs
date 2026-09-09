import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANONICAL_ASSET = '/assets/compare-slider-runtime-canonical-v14.js';
const LEGACY_VERSIONED_ASSET = '/assets/compare-slider-runtime-native-range-v13.js';
const SKIP_DIRS = new Set(['.git', 'node_modules', '.netlify', '.superpowers']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const files = walk(ROOT).filter(file => /\.(?:html|mjs|js)$/.test(file));
const productionFiles = files.filter(file => !rel(file).startsWith('tests/'));

function matchesAny(source, patterns) {
  return patterns.some(pattern => pattern.test(source));
}

const compareSignatures = [
  /id=["']compareSlider["']/,
  /class=["'][^"']*\bcompare-slider\b/,
  /data-compare-slider/,
  /\.compare-before/,
  /\.compare-after/,
];

const compareFiles = productionFiles
  .map(file => ({ file: rel(file), source: read(file) }))
  .filter(({ source }) => matchesAny(source, compareSignatures));

test('site-wide compare slider inventory is non-empty and traceable', () => {
  assert.ok(compareFiles.length > 0, 'expected at least one compare-slider implementation');
  for (const item of compareFiles) assert.ok(item.file, 'every inventory row must have a source path');
});

test('production references exactly one versioned canonical compare interaction asset', () => {
  const refs = compareFiles.flatMap(({ file, source }) => {
    const found = [...source.matchAll(/\/assets\/compare-slider-runtime[^"'`\s<)]*\.js/g)].map(match => match[0]);
    return found.map(asset => ({ file, asset }));
  });

  const activeAssets = new Set(refs.map(item => item.asset));
  assert.deepEqual([...activeAssets].sort(), [CANONICAL_ASSET], `unexpected compare runtime references: ${JSON.stringify(refs, null, 2)}`);
  assert.equal(refs.some(item => item.asset === LEGACY_VERSIONED_ASSET), false, 'v13 must no longer be a production interaction reference');
});

test('generator and page code do not own compare pointer/touch/range listeners', () => {
  const runtimeFiles = new Set([
    'assets/compare-slider-runtime-canonical-v14.js',
    'assets/compare-slider-runtime.js',
  ]);
  const forbidden = /(?:addEventListener\(\s*["'](?:pointerdown|pointermove|pointerup|pointercancel|touchstart|touchmove|touchend|input|change)["']|setPointerCapture\(|releasePointerCapture\()/;

  const offenders = compareFiles
    .filter(({ file }) => !runtimeFiles.has(file))
    .filter(({ source }) => forbidden.test(source))
    .map(({ file }) => file);

  assert.deepEqual(offenders, [], `compare interaction listeners must live only in canonical runtime: ${offenders.join(', ')}`);
});

test('legacy bounded compare endpoint logic is absent from production compare sources', () => {
  const boundedPatterns = [
    /Math\.max\(\s*(?:6|8|30|40)\s*,\s*Math\.min\(\s*(?:92|94|70|60)\s*,/,
    /aria-valuemin=["'](?:6|8|30|40)["']/,
    /aria-valuemax=["'](?:92|94|70|60)["']/,
  ];
  const offenders = compareFiles
    .filter(({ source }) => matchesAny(source, boundedPatterns))
    .map(({ file }) => file);
  assert.deepEqual(offenders, [], `legacy bounded compare logic found in: ${offenders.join(', ')}`);
});

test('canonical runtime declares one canonical-v14 ownership contract', () => {
  const runtimePath = path.join(ROOT, 'assets/compare-slider-runtime-canonical-v14.js');
  assert.ok(fs.existsSync(runtimePath), 'canonical v14 runtime must exist');
  const runtime = read(runtimePath);
  assert.match(runtime, /canonical-v14/);
  assert.match(runtime, /data-bg-compare-owner/);
  assert.match(runtime, /getBoundingClientRect\(\)/);
  assert.match(runtime, /clientX/);
  assert.match(runtime, /rect\.left/);
  assert.match(runtime, /rect\.width/);
});
