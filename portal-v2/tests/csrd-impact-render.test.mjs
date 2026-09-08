import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_IMPACT_SNAPSHOT, customerSafeSnapshot, csrdImpactMarkup } from '../csrd-impact.js';

test('customer view excludes internal evidence metadata', () => {
  const safe = customerSafeSnapshot(DEFAULT_IMPACT_SNAPSHOT);
  assert.equal('internal' in safe, false);
  assert.equal(safe.impactScore, 83);
  assert.equal(safe.readiness, 76);
});

test('dashboard exposes approved impact domains and audit/action affordances', () => {
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT);
  for (const label of ['CSRD & Impact','CO₂ & Klimaat','Water','Circulariteit','Social','Governance','CSRD Readiness']) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.match(html,/data-csrd-open="outcomes-evidence"/);
  assert.match(html,/data-csrd-open="actieve-acties"/);
  assert.match(html,/Klantweergave/);
});

test('customer markup does not leak internal evidence fields', () => {
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT,{customerView:true});
  assert.doesNotMatch(html,/Datakwaliteit|open evidence-items|Laatst gevalideerd/);
});
