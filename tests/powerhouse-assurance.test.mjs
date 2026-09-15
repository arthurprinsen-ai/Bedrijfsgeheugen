import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateComponentRegistry,
  validatePortalParity,
  discoverRepositoryDrift,
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

const verifiedParity = (overrides = {}) => ({
  legacy_key: 'overzicht',
  canonical_id: 'portal-overzicht-v2',
  status: 'verified',
  v2_surface: '/portal-v2/',
  authority: 'Powerhouse',
  writeback: 'runtime events',
  tests: ['tests/portal-v2.test.mjs'],
  evidence: 'production-readback',
  production_evidence_status: 'verified',
  ...overrides,
});

test('active component fails when a required assurance dimension is missing', () => {
  const result = validateComponentRegistry({ components: [complete({ security_contract: '' })] });
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

test('critical recovery without a drill is managed debt, not a hidden green claim', () => {
  const result = validateComponentRegistry({ components: [complete({ recovery_contract: { critical: true, status: 'documented', evidence: 'docs/recovery.md' } })] });
  assert.equal(result.ok, true);
  assert.equal(result.gaps.length, 0);
  assert.ok(result.obligations.some((item) => item.includes('tested recovery')));
});

test('portal parity fails on missing or unknown capability status', () => {
  const result = validatePortalParity({ capabilities: [verifiedParity({ status: 'unknown', evidence: '' })] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some((gap) => gap.includes('overzicht')));
});

test('portal contract parity may be verified while production evidence remains an explicit obligation', () => {
  const result = validatePortalParity({ capabilities: [verifiedParity({ production_evidence_status: 'pending', evidence: 'code-level parity only' })] });
  assert.equal(result.ok, true);
  assert.ok(result.obligations.some((item) => item.includes('production evidence pending')));
});

test('repository drift identifies an uncovered production surface', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwh-assurance-'));
  fs.mkdirSync(path.join(rootDir, 'netlify/functions'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'netlify/functions/known.js'), 'export default {}');
  fs.writeFileSync(path.join(rootDir, 'netlify/functions/unregistered.js'), 'export default {}');
  const drift = discoverRepositoryDrift({
    rootDir,
    registry: {
      drift_roots: ['netlify/functions'],
      components: [{ code_paths: ['netlify/functions/known.js'] }],
    },
  });
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.unregistered, ['netlify/functions/unregistered.js']);
});

test('assurance report cannot be LIVE & BEWEZEN when blocking gaps exist', () => {
  const report = buildAssuranceReport({
    registry: { components: [complete({ observability_contract: '' })] },
    parity: { capabilities: [] },
  });
  assert.notEqual(report.status, 'LIVE & BEWEZEN');
  assert.ok(report.gaps.length > 0);
  assert.equal(report.fingerprint, 'powerhouse-assurance-layer-v1');
});

test('managed evidence obligations hold overall status at DEELS LIVE without becoming a schema bypass', () => {
  const report = buildAssuranceReport({
    registry: { components: [complete({ recovery_contract: { critical: true, status: 'documented', evidence: 'docs/recovery.md' } })] },
    parity: { capabilities: [verifiedParity({ production_evidence_status: 'pending', evidence: 'code-level parity only' })] },
  });
  assert.equal(report.gaps.length, 0);
  assert.equal(report.status, 'DEELS LIVE');
  assert.equal(report.open_obligations.length, 2);
});

test('complete registry and verified production parity produce a deterministic green contract report', () => {
  const report = buildAssuranceReport({
    registry: { components: [complete()] },
    parity: { capabilities: [verifiedParity()] },
  });
  assert.equal(report.status, 'LIVE & BEWEZEN');
  assert.deepEqual(report.gaps, []);
  assert.deepEqual(report.open_obligations, []);
});