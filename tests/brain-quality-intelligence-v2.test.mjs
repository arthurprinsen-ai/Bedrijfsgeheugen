import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQualityV2Contract } from '../scripts/brain/powerhouse-quality-intelligence.mjs';
import { buildCoverageReport } from '../scripts/brain/quality/coverage-intelligence.mjs';

const contract = {
  fingerprint: 'powerhouse-quality-intelligence-v2',
  extends: 'powerhouse-quality-intelligence-v1',
  release_authority: 'powerhouse-quality-intelligence-v1',
  evidence_states: ['GREEN','RED','UNKNOWN','NOT_REGISTERED'],
  green_states: ['GREEN'],
  ai_policy: { may_waive_gate: false },
  deep_sensors: { release_authority: false },
  capabilities: [
    'coverage_intelligence','autonomous_exploratory_testing','semantic_visual_intelligence','stateful_fuzz_chaos_testing','production_shadow_verification','performance_root_cause_intelligence','security_adversarial_matrix','build_provenance_sbom','test_the_tests_intelligence','quality_economics'
  ]
};

test('v2 contract inherits v1 and requires all ten capabilities with fail-closed evidence', () => {
  const result = validateQualityV2Contract(contract);
  assert.equal(result.ok, true);
  assert.equal(contract.capabilities.length, 10);
  assert.deepEqual(contract.green_states, ['GREEN']);
});

test('UNKNOWN and NOT_REGISTERED can never validate as green evidence', () => {
  for (const state of ['UNKNOWN','NOT_REGISTERED']) {
    const result = validateQualityV2Contract({ ...contract, green_states: ['GREEN', state] });
    assert.equal(result.ok, false);
  }
});

test('coverage intelligence emits covered gaps and unknown without promoting missing evidence', () => {
  const report = buildCoverageReport({
    surfaces: [
      { id: 'public-home', authority: 'website', required: true },
      { id: 'tenant-rpc', authority: 'supabase', required: true },
      { id: 'preview-only', authority: 'portal', required: false },
    ],
    evidence: [
      { surface_id: 'public-home', state: 'GREEN', evidence: 'ci:123' },
      { surface_id: 'preview-only', state: 'NOT_REGISTERED' },
    ],
  });
  assert.deepEqual(report.covered.map(x => x.id), ['public-home']);
  assert.deepEqual(report.gaps.map(x => x.id), ['tenant-rpc']);
  assert.deepEqual(report.unknown.map(x => x.id), ['preview-only']);
  assert.equal(report.status, 'BLOCKED');
});

test('deep frontend audit persists actionable Axe node evidence for every serious violation', () => {
  const source = fs.readFileSync('scripts/brain/quality/frontend-deep-audit.mjs', 'utf8');
  for (const field of ['targets:', 'html:', 'failure_summary:']) assert.match(source, new RegExp(field));
  assert.match(source, /details:\s*\(violation\.nodes \|\| \[\]\)\.map/);
});

test('evidence-backed WCAG source fixes remain wired on all affected public pages', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  const prices = fs.readFileSync('prijzen.html', 'utf8');
  const dueDiligence = fs.readFileSync('due-diligence.html', 'utf8');

  assert.match(home, /id="quality-a11y-fix-v1"/);
  assert.match(home, /id="quality-a11y-focus-fix-v1"/);
  assert.match(home, /getElementById\('reviewCarousel'\)/);
  assert.match(home, /\.proof-label[^}]*color:#4C5961!important/);

  assert.match(prices, /id="quality-a11y-fix-v1"/);
  assert.match(prices, /\.voor\{color:#B8320B!important\}/);
  assert.match(prices, /\.plan\{color:#4C5961!important\}/);

  assert.match(dueDiligence, /id="quality-a11y-fix-v1"/);
  assert.match(dueDiligence, /bedrijf-overdraagbaar-maken[^}]*color:#AAB4FF!important/);
});
