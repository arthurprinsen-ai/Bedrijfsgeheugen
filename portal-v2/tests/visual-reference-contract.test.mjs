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
  'Welkom terug',
  'DAGELIJKSE ONDERNEMINGSSTURING',
  'Wat verandert er in je bedrijf — en wat doe je ermee?',
  'Signalen',
  'Wat heeft prioriteit?',
  'Uitkomsten & bewijs',
  'Bedrijfsgezondheid',
  'Kennisborging',
  'Processen',
  'Data & systemen',
  'AI-volwassenheid',
  'Van bron tot resultaat: zo werkt jouw bedrijfssturing',
  'Bronnen',
  'Powerhouse Connect',
  'Powerhouse Intelligence',
  'Powerhouse Agents',
  'Resultaat & leren',
  'Voorbeeld: samenvatting bedrijfssturing',
  'Aanbevelingen',
  'Snelle links',
  'Roadmap & voortgang',
  'Kansen & bedreigingen',
  'Impact overzicht',
  'Recente activiteiten',
  'Alle portalpagina’s',
];

test('portal-v2 retains existing functionality while leading with daily business steering', () => {
  for (const marker of requiredVisualMarkers) {
    assert.ok(html.includes(marker), `approved visual marker missing: ${marker}`);
  }
});


test('static illustrative dashboard content is hidden for customers before identity hydration',()=>{
 const samples=[...html.matchAll(/data-portal-sample-only="true" hidden/g)];
 assert.equal(samples.length,4);
 assert.match(html,/<section class="kpis" data-portal-customer-metrics="true" hidden>/);
 assert.match(html,/data-bg-portal-daily-steering="v1"/);
});

test('interactive example state is explicit and never masquerades as live evidence', () => {
  assert.ok(html.includes('Interactief voorbeeld'));
  assert.ok(html.includes('Klik door bron, inzicht, actie en resultaat.'));
  assert.equal(/class="livepill">\s*●\s*Live\b/.test(html), false);
});

test('rejected root preview implementations stay removed', () => {
  for (const name of ['klantenportaal-test.html', 'klantenportaal-selftest.html']) {
    assert.equal(fs.existsSync(path.join(repo, name)), false, `${name} must not return as an alternative design implementation`);
  }
});
