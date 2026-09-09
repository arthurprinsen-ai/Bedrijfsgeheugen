import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANONICAL_ASSET = '/assets/compare-slider-runtime-canonical-v14.js';
const LEGACY_VERSIONED_ASSET = '/assets/compare-slider-runtime-native-range-v13.js';
const SKIP_DIRS = new Set(['.git', 'node_modules', '.netlify', '.superpowers']);
const NON_PRODUCTION_ARTIFACTS = new Set([
  'index-oud.html',
  'prototype-v18-stable.html',
  'klantportaal.html',
  'klantportaal-demo.html',
  'klant-login.html',
]);

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
const productionFiles = files.filter(file => {
  const relative = rel(file);
  return !relative.startsWith('tests/') && !NON_PRODUCTION_ARTIFACTS.has(relative);
});

function matchesAny(source, patterns) {
  return patterns.some(pattern => pattern.test(source));
}

function hasCompareDom(source) {
  const html = String(source);
  if (/<[^>]+id=["']compareSlider["'][^>]*>/i.test(html)) return true;
  if (/<[^>]+class=["'][^"']*\bcompare-slider\b[^"']*["'][^>]*>/i.test(html)) return true;
  if (/<[^>]+\bdata-(?:bg-)?compare-slider\b[^>]*>/i.test(html)) return true;
  return /<[^>]+class=["'][^"']*\bcompare-before\b[^"']*["'][^>]*>/i.test(html)
    && /<[^>]+class=["'][^"']*\bcompare-after\b[^"']*["'][^>]*>/i.test(html);
}

function inlineScripts(source) {
  return [...String(source).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/i.test(match[1]))
    .map(match => match[2]);
}

function hasCompareInteractionMarker(source) {
  return /(?:compareSlider|compare-slider|data-bg-compare-slider|compare-before|compare-after|bg-compare|--bg-compare-split|--split)/i.test(String(source));
}

const compareFiles = productionFiles
  .filter(file => /\.html$/.test(file))
  .map(file => ({ file: rel(file), source: read(file) }))
  .filter(({ source }) => hasCompareDom(source));

test('site-wide compare slider inventory is non-empty and traceable', () => {
  assert.ok(compareFiles.length > 0, 'expected at least one production compare-slider DOM implementation');
  for (const item of compareFiles) assert.ok(item.file, 'every inventory row must have a source path');
});

test('production compare pages reference exactly one versioned canonical interaction asset', () => {
  const refs = compareFiles.flatMap(({ file, source }) => {
    const found = [...source.matchAll(/\/assets\/compare-slider-runtime[^"'`\s<)]*\.js/g)].map(match => match[0]);
    return found.map(asset => ({ file, asset }));
  });

  const activeAssets = new Set(refs.map(item => item.asset));
  assert.deepEqual([...activeAssets].sort(), [CANONICAL_ASSET], `unexpected compare runtime references: ${JSON.stringify(refs, null, 2)}`);
  assert.equal(refs.some(item => item.asset === LEGACY_VERSIONED_ASSET), false, 'v13 must no longer be a production interaction reference');
});

test('generator and page code do not own compare pointer/touch/range listeners', () => {
  const forbidden = /(?:addEventListener\(\s*["'](?:pointerdown|pointermove|pointerup|pointercancel|touchstart|touchmove|touchend|input|change)["']|setPointerCapture\(|releasePointerCapture\()/;
  const offenders = [];

  for (const { file, source } of compareFiles) {
    const compareScripts = inlineScripts(source).filter(hasCompareInteractionMarker);
    if (compareScripts.some(script => forbidden.test(script))) offenders.push(file);
  }

  const generatorPath = path.join(ROOT, 'tools/site-shell/fix-homepage-context-slider.mjs');
  const generator = read(generatorPath);
  if (hasCompareInteractionMarker(generator) && forbidden.test(generator)) offenders.push(rel(generatorPath));

  assert.deepEqual([...new Set(offenders)].sort(), [], `compare interaction listeners must live only in canonical runtime: ${offenders.join(', ')}`);
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
