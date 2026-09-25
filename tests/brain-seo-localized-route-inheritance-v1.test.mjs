import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('SEO order engine classifies /en routes through their Dutch source canonical without replacing the English canonical', () => {
  const source=fs.readFileSync('tools/seo-order-engine/apply.mjs','utf8');
  assert.match(source,/sourceCanonicalForLocale/);
  assert.match(source,/url\.pathname==='\/en'/);
  assert.match(source,/url\.pathname\.startsWith\('\/en\/'\)/);
  assert.match(source,/classifyCanonical\(sourceCanonical,registry\)/);
  assert.match(source,/sourceCanonical===canonical \? sourceEntry : \{ \.\.\.sourceEntry, route:canonical \}/);
});

test('localized commercial routes no longer hit commercial-signal rejection before source ownership resolution', () => {
  const source=fs.readFileSync('tools/seo-order-engine/apply.mjs','utf8');
  const sourceIndex=source.indexOf('const sourceCanonical=sourceCanonicalForLocale(canonical)');
  const classifyIndex=source.indexOf('classifyCanonical(sourceCanonical,registry)', sourceIndex);
  assert.ok(sourceIndex >= 0 && classifyIndex > sourceIndex);
});
