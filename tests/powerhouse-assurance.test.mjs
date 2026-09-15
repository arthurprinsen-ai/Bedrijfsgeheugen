import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateComponentRegistry,
  validatePortalParity,
  buildAssuranceReport,
} from '../scripts/powerhouse-assurance-check.mjs';

const complete = (overrides = {}) => ({
  canonical_id: 'example-component-v1',
  name: 'Example Component',
  lifecycle: 'active',
  authority: 'GitHub current main + production readback',
  owner: 'Powerhouse',
  code_paths: ['scripts/example.mjs'],
  runtime_surfaces: ['production'],
  docs: ['docs/example.md'],
  dependencies: [],
  data_contract: 'canonical Powerhouse data only',
  security_contract: 'fail-closed',
  observability_contract: 'health/readback required',
  recovery_contract: { critical: true, status: 'tested', evidence: 'tests/recovery.test.mjs' },
  cost_capacity_contract: 'metered/bounded',
  test_contract: ['tests/example.test.mjs'],
  evidence_contract: 'production/provider readback',
  learning_contract: 'existing Powerhouse learning lineage',
  last_verified_at: '2026-09-15T19:00:00Z',
  ...overrides,
});

test('active component fails when a required assurance dimension is missing', () => {
  const component = complete({ security_contract: '' });
  const result = validateComponentRegistry({ components: [component] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some((gap) => gap.includes('security_contract')));
});

test('duplicate canonical component ids fail closed', () => {
  const a = complete();
  const result = validateComponentRegistry({ components: [a, { ...a, name: 'Duplicate' }] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some((gap) => gap.includes('duplicate canonical_id')));
});

test('deprecated or superseded components require retirement evidence', () => {
  const result = validateComponentRegistry({ components: [complete({ lifecycle: 'deprecated', recovery_contract: { critical: false, status: 'documented', evidence: 'docs/recovery.md' } })] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some((gap) => gap.includes('retirement')));
});

test('critical active components require tested recovery proof', () => {
  const result = validateComponentRegistry({ components: [complete({ recovery_contract: { critical: true, status: 'documented', evidence: 'docs/recovery.md' } })] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some((gap) => gap.includes('tested recovery')));
});

test('portal parity fails on missing or unknown capability status', () => {
  const result = validatePortalParity({ capabilities: [
    { legacy_key: 'overzicht', canonical_id: 'portal-overzicht-v2', status: 'unknown', v2_surface: '/portal-v2/', authority: 'Powerhouse', writeback: 'runtime events', tests: ['tests/portal-v2.test.mjs'], evidence: '' },
  ]});
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some((gap) => gap.includes('overzicht')));
});

test('assurance report cannot be LIVE & BEWEZEN when unmanaged gaps exist', () => {
  const report = buildAssuranceReport({
    registry: { components: [complete({ observability_contract: '' })] },
    parity: { capabilities: [] },
  });
  assert.notEqual(report.status, 'LIVE & BEWEZEN');
  assert.ok(report.gaps.length > 0);
  assert.equal(report.fingerprint, 'powerhouse-assurance-layer-v1');
});

test('complete registry and verified parity produce a deterministic green contract report', () => {
  const report = buildAssuranceReport({
    registry: { components: [complete()] },
    parity: { capabilities: [
      { legacy_key: 'overzicht', canonical_id: 'portal-overzicht-v2', status: 'verified', v2_surface: '/portal-v2/', authority: 'Powerhouse', writeback: 'runtime events', tests: ['tests/portal-v2.test.mjs'], evidence: 'production-readback' },
    ] },
  });
  assert.equal(report.status, 'LIVE & BEWEZEN');
  assert.deepEqual(report.gaps, []);
});