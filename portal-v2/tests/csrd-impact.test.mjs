import test from 'node:test';
import assert from 'node:assert/strict';
import { findPortalPage, PORTAL_SECTIONS } from '../../portal-next/portal-content-map.js';
import { CSRD_TABS, DEFAULT_IMPACT_SNAPSHOT, customerSafeSnapshot, csrdImpactMarkup, withResourceFootprint, withResourceIntelligence } from '../csrd-impact.js';

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
  for (const label of ['CSRD Readiness','Impact in real time','CO₂-uitstoot','Waterverbruik','Social impact','Circulariteit','Bekijk alle acties']) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-csrd-open="outcomes-evidence"/);
});

test('fallback dashboard preserves realtime design language but never claims unsupported live data', () => {
  const html = csrdImpactMarkup(DEFAULT_IMPACT_SNAPSHOT);
  assert.match(html,/Voorbeelddata · geen live claim/);
  assert.doesNotMatch(html,/>Live data</);
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

test('resource footprint fails closed when coverage has no canonical factor lineage', () => {
  const snapshot = withResourceFootprint({coverage:0.8,confidence:0.9,energyKwh:12.4,co2eKg:2.1,waterLiters:183});
  assert.equal(snapshot.resourceFootprint, undefined);
  assert.match(csrdImpactMarkup(snapshot), /Voorbeelddata · geen live claim/);
});

test('resource footprint never fabricates freshness when calculation timestamp is absent', () => {
  const snapshot = withResourceFootprint({
    coverage:1,
    confidence:0.9,
    factorVersions:['openai-gpt-5.6-2026-09'],
    methodologies:['provider-model-resource-factor'],
    sources:['provider-model-evidence'],
    calculationStatus:'calculated',
    energyKwh:12.4,
    co2eKg:2.1,
    waterLiters:183
  });
  assert.equal(snapshot.resourceFootprint, undefined);
});

test('resource footprint becomes data-backed only with complete canonical lineage and freshness', () => {
  const snapshot = withResourceFootprint({
    coverage:1,
    confidence:0.9,
    calculatedAt:'2026-09-16T08:30:00.000Z',
    factorVersions:['factor:provider-model-v1'],
    methodologies:['provider-model-resource-factor'],
    sources:['powerhouse_resource_impact_v1'],
    calculationStatus:'calculated',
    measurementClass:'calculated',
    energyKwh:12.4,
    co2eKg:2.1,
    waterLiters:183
  });
  assert.equal(snapshot.resourceFootprint?.dataBacked, true);
  assert.equal(snapshot.resourceFootprint?.calculatedAt, '2026-09-16T08:30:00.000Z');
  assert.deepEqual(snapshot.resourceFootprint?.factorVersions, ['factor:provider-model-v1']);
  assert.deepEqual(snapshot.resourceFootprint?.methodologies, ['provider-model-resource-factor']);
  assert.deepEqual(snapshot.resourceFootprint?.sources, ['powerhouse_resource_impact_v1']);
  assert.match(csrdImpactMarkup(snapshot), /Data-backed · 100% brondekking/);
});


test('resource intelligence keeps normalized daily rows available to the analytics dashboard', () => {
  const snapshot = withResourceIntelligence({
    resource_daily:[{day:'2026-09-19T00:00:00Z',provider:'openai',resource_type:'ai_tokens',unit:'tokens',resource_amount:1234,usage_events:4,co2e_kg:0.12,water_liters:1.5,energy_kwh:0.3,provenance_complete:true}]
  });
  assert.equal(snapshot.resourceIntelligence.daily.length,1);
  assert.equal(snapshot.resourceIntelligence.daily[0].provider,'openai');
  const html = csrdImpactMarkup(snapshot);
  assert.match(html,/Resource & Sustainability/);
  assert.match(html,/Tokens/);
  assert.match(html,/Credits/);
});
