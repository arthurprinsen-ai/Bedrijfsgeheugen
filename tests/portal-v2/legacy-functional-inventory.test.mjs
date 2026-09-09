import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_FUNCTIONAL_INVENTORY,
  assertFunctionalInventoryComplete,
} from '../../portal-v2/legacy-functional-inventory.js';

const required = [
  'overzicht','profiel','dataai','aiscan','invoeren','antwoorden',
  'business','cijfers','waarde','mensen','branche','onderzoek',
  'beleid','aicap','strategie','canvassen','eindconclusie','dd',
  'dna','bijhouden','wijzigingen','advies','offerte','roadmap',
];

test('legacy functional inventory covers every protected capability', () => {
  assert.deepEqual(Object.keys(LEGACY_FUNCTIONAL_INVENTORY).sort(), required.sort());
  assert.doesNotThrow(() => assertFunctionalInventoryComplete());
});

test('every capability records fields, models, calculations, actions and dependencies', () => {
  for (const [id, item] of Object.entries(LEGACY_FUNCTIONAL_INVENTORY)) {
    for (const key of ['fields','models','calculations','actions','dependencies']) {
      assert.ok(Array.isArray(item[key]), `${id}.${key} must be an array`);
    }
    assert.ok(item.v2Page, `${id}.v2Page is required`);
  }
});

test('legacy global capabilities and overview semantic invariants are inventoried', () => {
  const overview = LEGACY_FUNCTIONAL_INVENTORY.overzicht;
  assert.ok(overview.globalCapabilities?.includes('export'));
  assert.ok(overview.globalCapabilities?.includes('import'));
  assert.ok(overview.globalCapabilities?.includes('permission-gated-print'));
  assert.ok(overview.globalCapabilities?.includes('feedback'));
  assert.ok(overview.globalCapabilities?.includes('customer-branding'));
  assert.ok(overview.globalCapabilities?.includes('logout'));
  assert.ok(overview.semanticInvariants?.includes('capacity-not-cash'));
  assert.ok(overview.semanticInvariants?.includes('46-week-annualization'));
});
