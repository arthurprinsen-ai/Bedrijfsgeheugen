import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * Canonical shell parity has exactly one authority: the dedicated shell
 * contract/full-build/live-readback gates. seocontrole.py owns SEO semantics
 * and must not duplicate the raw header/footer byte oracle.
 */
test('SEO validator does not duplicate canonical shell ownership', async () => {
  const source = await readFile('.github/scripts/seocontrole.py', 'utf8');
  assert.doesNotMatch(source, /de menubalk wijkt af van \.github\/canoniek\/kop\.html/);
  assert.doesNotMatch(source, /de voettekst wijkt af van \.github\/canoniek\/voet\.html/);
  assert.doesNotMatch(source, /re\.search\([^\n]*bgkop/);
});

test('dedicated canonical shell workflows remain the shell authority', async () => {
  const fullBuild = await readFile('.github/workflows/canonical-brand-shell-full-build.yml', 'utf8');
  const liveReadback = await readFile('.github/workflows/canonical-brand-shell-live-readback.yml', 'utf8');
  assert.match(fullBuild, /Canonical brand shell full build/);
  assert.match(liveReadback, /Canonical brand shell live readback/);
});

test('de oude V17-header wordt niet meer gebruikt als referentie', async () => {
  const source = await readFile('.github/scripts/seocontrole.py', 'utf8');
  assert.doesNotMatch(source, /re\.search\(\s*r?['"]<header[^'"]*v17-header/, 'de validator valt nog terug op de V17-header');
});
