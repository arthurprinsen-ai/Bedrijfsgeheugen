import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTokenFootprint, aggregateTokenFootprint } from '../platform/cost/ai-token-usage.mjs';
import { csrdImpactMarkup, withResourceFootprint } from '../portal-v2/csrd-impact.js';

test('AI footprint fails closed without a matching factor', () => {
  const result = deriveTokenFootprint({ requestId:'R1', provider:'ProviderA', providerModelId:'ModelA', totalTokens:500, at:'2026-09-15T12:00:00Z' }, []);
  assert.equal(result.status, 'unknown_factor');
  assert.equal(result.energyKwh, null);
  assert.equal(result.co2eKg, null);
  assert.equal(result.waterLiters, null);
});

test('database-shaped factor produces deterministic traceable impact', () => {
  const result = deriveTokenFootprint(
    { requestId:'R2', provider:'ProviderA', providerModelId:'ModelA', totalTokens:2000, at:'2026-09-15T12:00:00Z' },
    [{ factor_id:'factor-v1', source:'ProviderA', provider_model_id:'ModelA', resource_type:'ai_tokens', unit:'tokens', quantity_basis:1000, energy_kwh:0.002, co2e_kg:0.0006, water_liters:0.01, methodology:'published-method-v1', confidence:0.6, valid_from:'2026-01-01', valid_to:'2026-12-31' }]
  );
  assert.equal(result.status, 'calculated');
  assert.equal(result.energyKwh, 0.004);
  assert.equal(result.co2eKg, 0.0012);
  assert.equal(result.waterLiters, 0.02);
  assert.equal(result.factorId, 'factor-v1');
  assert.equal(result.measurementClass, 'estimated');
});

test('footprint aggregation is idempotent and exposes coverage', () => {
  const summary = aggregateTokenFootprint([
    {requestId:'A',status:'calculated',energyKwh:1,co2eKg:2,waterLiters:3,confidence:0.8,factorId:'v1',methodology:'m1'},
    {requestId:'A',status:'calculated',energyKwh:1,co2eKg:2,waterLiters:3,confidence:0.8,factorId:'v1',methodology:'m1'},
    {requestId:'B',status:'unknown_factor',energyKwh:null,co2eKg:null,waterLiters:null,confidence:0,factorId:null,methodology:null}
  ]);
  assert.equal(summary.totalRequests, 2);
  assert.equal(summary.calculatedRequests, 1);
  assert.equal(summary.coverage, 0.5);
  assert.equal(summary.energyKwh, 1);
});

test('CSRD stays explicit example data without coverage and becomes data-backed with coverage', () => {
  assert.match(csrdImpactMarkup(), /Voorbeelddata · geen live claim/);
  const snapshot = withResourceFootprint({ energyKwh:12.5, co2eKg:2.4, waterLiters:180, coverage:0.75, confidence:0.8, factorVersions:['factor-v1'], methodologies:['method-v1'], calculatedAt:'2026-09-15T18:00:00Z' });
  const html = csrdImpactMarkup(snapshot);
  assert.match(html, /Data-backed · 75% brondekking/);
  assert.match(html, /12,5 kWh/);
  assert.match(html, /2,4 kg/);
  assert.match(html, /180 liter/);
});
