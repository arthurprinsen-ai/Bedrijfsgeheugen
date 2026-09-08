import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_PARITY_ITEMS, GLOBAL_PARITY_CAPABILITIES } from '../portal-v2/parity-manifest.js';
import { findPage } from '../portal-v2/page-registry.js';

const expected = ['overzicht','profiel','dataai','aiscan','invoeren','antwoorden','business','cijfers','waarde','mensen','branche','onderzoek','beleid','aicap','strategie','canvassen','eindconclusie','dd','dna','bijhouden','wijzigingen','advies','offerte','roadmap'];

test('all protected legacy panels have canonical V2 destinations', () => {
  assert.deepEqual(LEGACY_PARITY_ITEMS.map(x => x.legacyId), expected);
  for (const item of LEGACY_PARITY_ITEMS) {
    assert.ok(item.v2Pages.length > 0, item.legacyId);
    for (const pageId of item.v2Pages) assert.ok(findPage(pageId), `${item.legacyId} -> ${pageId}`);
    assert.ok(item.requiredBehaviors.length > 0, `${item.legacyId} must define behavior, not route-only parity`);
  }
});

test('all protected global capabilities are represented', () => {
  assert.deepEqual(GLOBAL_PARITY_CAPABILITIES.map(x => x.id), ['auth','logout','export','import','print','feedback','customer-branding','mobile-navigation']);
});
