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

test('dedicated canonical shell workflow remains the shell authority', async () => {
  const workflow = await readFile('.github/workflows/canonical-brand-shell.yml', 'utf8');
  assert.match(workflow, /canonical/i);
  assert.match(workflow, /shell/i);
});

test('de oude V17-header wordt niet meer gebruikt als referentie', async () => {
  const source = await readFile('.github/scripts/seocontrole.py', 'utf8');
  assert.doesNotMatch(source, /re\.search\(\s*r?['"]<header[^'"]*v17-header/, 'de validator valt nog terug op de V17-header');
});
