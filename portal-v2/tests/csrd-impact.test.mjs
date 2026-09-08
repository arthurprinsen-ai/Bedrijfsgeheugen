import test from 'node:test';
import assert from 'node:assert/strict';
import { findPortalPage, PORTAL_SECTIONS } from '../../portal-next/portal-content-map.js';
import { CSRD_TABS, DEFAULT_IMPACT_SNAPSHOT, customerSafeSnapshot, csrdImpactMarkup } from '../csrd-impact.js';

test('CSRD impact is a first-class portal page in Inzicht', () => {
  const page = findPortalPage('csrd-impact');
  assert.ok(page, 'csrd-impact must be registered');
  assert.equal(page.sectionId, 'inzicht');
  assert.equal(page.label, 'CSRD & Impact');
  assert.equal(page.legacyTab, null);
  assert.ok(PORTAL_SECTIONS.inzicht.pages.includes('csrd-impact'));
});

test('customer view removes internal evidence metadata without mutating source data', () => {
  const safe = customerSafeSnapshot(DEFAULT_IMPACT_SNAPSHOT);
  assert.equal('internal' in safe, false);
  assert.ok(DEFAULT_IMPACT_SNAPSHOT.internal);
  assert.equal(safe.impactScore, DEFAULT_IMPACT_SNAPSHOT.impactScore);
});

test('dashboard contains the six approved impact lenses and audit/action affordances', () => {
  assert.deepEqual(CSRD_TABS.map(x => x[1]), ['Totaal','CO₂ & Klimaat','Water','Circulariteit','Social','Governance']);
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT);
  for (const label of ['CSRD Readiness','Impactmetingen','CO₂-uitstoot','Waterverbruik','Social impact','Circulariteit','Bekijk alle acties']) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-csrd-open="outcomes-evidence"/);
});

test('fallback dashboard is explicit preview data and never claims unsupported live data', () => {
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT);
  assert.match(html,/Voorbeelddata/);
  assert.doesNotMatch(html,/Live data/);
  assert.doesNotMatch(html,/audit-ready/);
});

test('full-screen dashboard exposes a deterministic close control', () => {
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT);
  assert.match(html,/data-csrd-close/);
  assert.match(html,/aria-label="Sluit CSRD dashboard"/);
});

test('customer markup never renders internal evidence metadata', () => {
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT,{customerView:true});
  assert.doesNotMatch(html,/Datakwaliteit/);
  assert.doesNotMatch(html,/open evidence-items/);
  assert.match(html,/Interne weergave/);
});
