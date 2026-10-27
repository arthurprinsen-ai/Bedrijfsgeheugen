import test from 'node:test';
import assert from 'node:assert/strict';
import { project, confidence } from '../portal-v2/nextgen-intelligence.js';

// Since #4475 the Future Lens only shows independently verified, tenant-bound canonical forecasts.
// Visible KPI text (value/delta) must never produce a projection or a confidence.
const now = Date.now();
const iso = (msAgo) => new Date(now - msAgo).toISOString();
const forecast = (over = {}) => ({
  status: 'VERIFIED',
  origin: 'authenticated_portal_forecast',
  tenantId: 'tenant-a',
  metricKey: 'bedrijfsgezondheid',
  modelVersion: 'forecast-v1',
  sourceRefs: ['source:one'],
  backtest: { status: 'PASS' },
  independentReview: { approved: true },
  currentValue: 70,
  expected: 74,
  lower: 71,
  upper: 78,
  horizonMonths: 6,
  calibratedConfidence: 72,
  verifiedAt: iso(86400000),
  sourceUpdatedAt: iso(86400000),
  ...over
});
const metric = (over = {}) => ({ value: 70, delta: 2, label: 'Bedrijfsgezondheid', tenantId: 'tenant-a', metricKey: 'bedrijfsgezondheid', canonicalForecast: forecast(), ...over });

test('Portal V2 Future Lens projects only a verified base forecast inside its own interval', () => {
  const p = project(metric(), 6, 'base');
  assert.ok(p);
  assert.equal(p.projected, 74);
  assert.equal(p.change, 4);
  assert.ok(p.lower <= p.projected && p.projected <= p.upper);
  assert.deepEqual(p.sourceRefs, ['source:one']);
  // No invented scenario paths and no horizon the forecast was not verified for.
  for (const scenario of ['stress', 'opportunity']) assert.equal(project(metric(), 6, scenario), null);
  assert.equal(project(metric(), 12, 'base'), null);
});

test('Portal V2 Future Lens confidence is the calibrated value, never derived from visible KPI text', () => {
  assert.equal(confidence(metric()), 72);
  assert.equal(confidence({ value: 70, delta: 2, label: 'Bedrijfsgezondheid' }), null);
  assert.equal(confidence({ value: null, delta: null }), null);
  assert.equal(confidence(metric({ canonicalForecast: forecast({ calibratedConfidence: 130 }) })), null);
  assert.equal(confidence(metric({ canonicalForecast: forecast({ calibratedConfidence: 'high' }) })), null);
});

test('unverified, mismatched, stale or incoherent forecasts never produce a projection', () => {
  assert.equal(project({ value: 62, delta: -3, label: 'Kennisborging' }, 6, 'base'), null);
  const bad = [
    { status: 'DRAFT' },
    { origin: 'visible_kpi_text' },
    { tenantId: 'tenant-b' },
    { metricKey: 'other-metric' },
    { sourceRefs: [] },
    { backtest: { status: 'FAIL' } },
    { independentReview: { approved: false } },
    { lower: 80 },
    { upper: 70 },
    { expected: Number.NaN },
    { verifiedAt: iso(31 * 86400000) },
    { sourceUpdatedAt: iso(31 * 86400000) },
    { verifiedAt: new Date(now + 86400000).toISOString() }
  ];
  for (const over of bad) assert.equal(project(metric({ canonicalForecast: forecast(over) }), 6, 'base'), null, JSON.stringify(over));
});
