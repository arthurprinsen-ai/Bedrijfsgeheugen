import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_PORTAL_MAP, assertMigrationTransition } from '../platform/migrations/legacy-portal-map.mjs';
import { createChange, assertChangeTransition, verifyImpact } from '../platform/changes/change-engine.mjs';
import { createAssessmentResponse, createScanScore } from '../platform/migrations/frisse-blik.mjs';
import { createWebsiteBusinessTruthView, detectCommercialTruthConflict } from '../platform/read-models/website.mjs';
import { createLearningRecord, valueEfficiency } from '../platform/intelligence/learning.mjs';

test('every protected legacy portal panel has an executable canonical migration mapping', () => {
  const expected = ['overzicht','profiel','dataai','aiscan','invoeren','antwoorden','business','cijfers','waarde','mensen','branche','onderzoek','beleid','aicap','strategie','canvassen','eindconclusie','dd','dna','bijhouden','wijzigingen','advies','offerte','roadmap'];
  for (const key of expected) assert.ok(LEGACY_PORTAL_MAP[key], `${key} missing`);
  assert.equal(Object.keys(LEGACY_PORTAL_MAP).length, expected.length);
});

test('migration cannot jump from mapped directly to retired', () => {
  assert.equal(assertMigrationTransition('BASELINE_CAPTURED','MAPPED'), true);
  assert.throws(() => assertMigrationTransition('MAPPED','RETIRED'), /invalid migration transition/i);
});

test('change lifecycle preserves working-to-active review and separates predicted impact', () => {
  const change = createChange({ id:'CHG-1', tenantId:'T1', objectId:'PRICE-1', ownerId:'U1', reason:'pricing experiment', fromVersion:1, toVersion:2, status:'Working', before:{ price:299 }, after:{ price:349 }, directImpact:['PRICE-1'], dependentImpact:['WEBSITE-1'], predictedImpact:['REV-1'], rollback:'restore v1' });
  assert.equal(change.status, 'Working');
  assert.equal(assertChangeTransition('Working','ImpactAnalysis'), true);
  assert.throws(() => assertChangeTransition('Working','Active'), /invalid change transition/i);
  assert.equal(verifyImpact({ expected:100, observed:88, verified:79, confidence:.8, attribution:'Experiment' }).verified, 79);
});

test('Frisse Blik source responses are immutable and score semantics are versioned', () => {
  const response = createAssessmentResponse({ id:'R1', tenantId:'T1', scanVersion:'FB-1', questionId:'Q1', answer:3, submittedAt:'2026-08-29T10:00:00Z', sourceRef:'scan/1' });
  const scoreV1 = createScanScore({ tenantId:'T1', scanVersion:'FB-1', scoreModelVersion:'score-v1', score:68, calculatedAt:'2026-08-29T10:01:00Z', responseIds:['R1'] });
  const scoreV2 = createScanScore({ tenantId:'T1', scanVersion:'FB-1', scoreModelVersion:'score-v2', score:72, calculatedAt:'2026-08-29T10:02:00Z', responseIds:['R1'] });
  assert.equal(response.immutable, true);
  assert.equal(scoreV1.score, 68);
  assert.equal(scoreV2.score, 72);
});

test('website projection consumes canonical commercial truth and discrepancies create findings', () => {
  const view = createWebsiteBusinessTruthView({ tenantId:'T1', proposition:{ id:'PROP-1', text:'Grip' }, pricePlans:[{ id:'SCALE', price:349 }], generatedAt:'2026-08-29T10:00:00Z', sourceStateVersion:2 });
  assert.equal(view.pricePlans[0].price, 349);
  assert.equal(detectCommercialTruthConflict({ canonicalPrice:349, websitePrice:349, billingPrice:299 }).type, 'PricingConsistencyFinding');
  assert.equal(detectCommercialTruthConflict({ canonicalPrice:349, websitePrice:349, billingPrice:349 }), null);
});

test('learning records prediction error and cost only against verified value', () => {
  const learning = createLearningRecord({ id:'L1', tenantId:'T1', recommendationId:'REC-1', changeId:'CHG-1', expectedImpact:110, observedImpact:84, verifiedImpact:79, confidence:.8, attribution:'Controlled comparison', recordedAt:'2026-08-29T10:00:00Z' });
  assert.equal(learning.predictionError, -31);
  assert.equal(valueEfficiency({ verifiedValue:79, cost:4 }).ratio, 19.75);
});
