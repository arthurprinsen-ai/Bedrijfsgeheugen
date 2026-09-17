import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_CAPABILITIES } from '../portal/core.mjs';
import { findPage } from '../portal-v2/page-registry.js';
import { MODULAR_LEGACY_CAPABILITY_MAP, modularLegacyParityGaps } from '../portal-v2/modular-legacy-capability-map.js';

const EXPECTED_IDS = [
  'overzicht','bedrijfsgezondheid','strategie-uitvoering','processen-organisatie','kennis',
  'data-koppelingen','ai-insights','acties-impact','rapportages','koppelingen-bouwen',
  'roadmap','facturen-abonnement','organisatie-gebruikers','instellingen','frisse-blik'
];

test('modular legacy baseline still exposes all 15 protected capabilities', () => {
  assert.deepEqual(LEGACY_CAPABILITIES.map(item => item.id), EXPECTED_IDS);
});

test('every modular legacy capability maps to an existing native V2 page', () => {
  assert.equal(Object.keys(MODULAR_LEGACY_CAPABILITY_MAP).length, EXPECTED_IDS.length);
  for (const legacy of LEGACY_CAPABILITIES) {
    const mapping = MODULAR_LEGACY_CAPABILITY_MAP[legacy.id];
    assert.ok(mapping, `missing V2 mapping for ${legacy.id}`);
    assert.equal(mapping.legacyRoute, legacy.canonicalRoute, `${legacy.id}: legacy route drift`);
    assert.equal(mapping.requiredSurface, legacy.requiredSurface, `${legacy.id}: required surface drift`);
    assert.ok(findPage(mapping.v2Page), `${legacy.id}: V2 page ${mapping.v2Page} does not exist`);
  }
});

test('modular legacy capability parity has zero open gaps', () => {
  assert.deepEqual(modularLegacyParityGaps(), []);
});
