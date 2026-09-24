import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('assets/js/i18n.js','utf8');

test('unprefixed public pages ignore stale stored locale and stay on Dutch static route', () => {
  assert.match(source, /locale = portal \? preferredLocale\(\) : \(routed \|\| 'nl'\);/);
  assert.doesNotMatch(source, /if \(!routed \|\| \(routed === 'en'/);
});

test('public language selection still navigates to canonical localized route', () => {
  assert.match(source, /location\.assign\(localizedHref\(normalized\)\);/);
  assert.match(source, /const pathname = '\/' \+ normalized/);
});

test('runtime translation remains portal-only except explicit untranslated English fallback', () => {
  assert.match(source, /if \(portal \|\| \(routed === 'en' && !staticTranslated\)\)/);
});
