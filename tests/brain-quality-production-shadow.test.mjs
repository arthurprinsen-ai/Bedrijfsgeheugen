import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeShadowObservation } from '../scripts/brain/quality/production-shadow.mjs';

test('contract or SLO drift creates escaped-defect obligation for canonical learning', () => {
  const result = normalizeShadowObservation({ surface_id: 'public-home', contract_ok: false, slo_ok: true, evidence: 'probe:1' });
  assert.equal(result.state, 'RED');
  assert.equal(result.obligation.type, 'escaped_defect');
  assert.equal(result.obligation.learning_authority, 'BRAIN-CLOSED-LOOP-v1');
});

test('missing production evidence is UNKNOWN and never green', () => {
  assert.equal(normalizeShadowObservation({ surface_id: 'x' }).state, 'UNKNOWN');
});
