import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const portal = path.resolve(here, '..');
const repo = path.resolve(portal, '..');
const html = fs.readFileSync(path.join(portal, 'index.html'), 'utf8');

const requiredVisualMarkers = [
  'Welkom terug, Arthur',
  'Bedrijfsgezondheid',
  'Kennisborging',
  'Processen',
  'Data & systemen',
  'AI-volwassenheid',
  'Het brein van je bedrijf',
  '1. Bronnen',
  '2. Het bedrijfsgeheugen',
  '3. Klantenportaal',
  'AI Brain',
  'Datahub',
  'Powerhouse',
  'AI Management Summary',
  'Aanbevelingen',
  'Snelle links',
  'Roadmap & voortgang',
  'Kansen & bedreigingen',
  'Impact overzicht',
  'Recente activiteiten',
  'Alle portalpagina’s',
];

test('portal-v2 keeps the approved dashboard composition intact', () => {
  for (const marker of requiredVisualMarkers) {
    assert.ok(html.includes(marker), `approved visual marker missing: ${marker}`);
  }
});

test('preview state is explicit and never presented as production evidence', () => {
  assert.ok(html.includes('Preview'));
  assert.ok(html.includes('geen productieclaim'));
  assert.equal(/class="livepill">\s*●\s*Live\b/.test(html), false);
});

test('rejected root preview implementations stay removed', () => {
  for (const name of ['klantenportaal-test.html', 'klantenportaal-selftest.html']) {
    assert.equal(fs.existsSync(path.join(repo, name)), false, `${name} must not return as an alternative design implementation`);
  }
});
