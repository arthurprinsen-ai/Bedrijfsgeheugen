import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('assets/js/i18n.js','utf8');
const builder = await readFile('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify = await readFile('netlify.toml','utf8');

test('unprefixed public pages ignore stale stored locale and stay on Dutch static route', () => {
  assert.match(source, /locale = portal \? preferredLocale\(\) : \(routed \|\| 'nl'\);/);
  assert.doesNotMatch(source, /if \(!routed \|\| \(routed === 'en'/);
});

test('public language selection navigates symmetrically between canonical Dutch and English routes', () => {
  assert.match(source, /location\.assign\(localizedHref\(normalized\)\);/);
  assert.match(source, /normalized === 'en'/);
  assert.match(source, /\? '\/en' \+ \(stripped === '\/' \? '\/' : stripped\)/);
  assert.match(source, /: \(stripped === '\/' \? '\/' : stripped\)/);
  assert.doesNotMatch(source, /const pathname = '\/' \+ normalized/);
});

test('runtime translation remains portal-only except explicit untranslated English fallback', () => {
  assert.match(source, /if \(portal \|\| \(routed === 'en' && !staticTranslated\)\)/);
});

test('static build and hosting keep Dutch unprefixed and English under /en', () => {
  assert.match(builder, /if \(locale === 'nl'\) return route === '\/' \? '\/' : route;/);
  assert.match(builder, /return '\/en' \+ \(route === '\/' \? '\/' : route\);/);
  assert.match(netlify, /from = "\/nl\/\*"[\s\S]*to = "\/:splat"[\s\S]*status = 301/);
});
