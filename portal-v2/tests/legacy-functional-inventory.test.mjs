import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_FUNCTIONAL_INVENTORY,
  assertFunctionalInventoryComplete,
} from '../legacy-functional-inventory.js';
import { LEGACY_PARITY_ITEMS, listOpenFunctionalParityItems } from '../parity-manifest.js';

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
  for (const capability of ['export','import','permission-gated-print','feedback','customer-branding','logout']) {
    assert.ok(overview.globalCapabilities?.includes(capability), `missing global capability: ${capability}`);
  }
  assert.ok(overview.semanticInvariants?.includes('capacity-not-cash'));
  assert.ok(overview.semanticInvariants?.includes('46-week-annualization'));
});

test('page-presence parity and full functional parity are not conflated', () => {
  assert.equal(LEGACY_PARITY_ITEMS.length, 24);
  assert.equal(listOpenFunctionalParityItems().length, 24);
  for (const item of LEGACY_PARITY_ITEMS) {
    assert.ok(item.functionalInventory, `${item.legacyId} must point to its functional inventory`);
    assert.equal(item.functionalParityStatus, 'open', `${item.legacyId} must stay open until its real workspace is proven`);
  }
});
