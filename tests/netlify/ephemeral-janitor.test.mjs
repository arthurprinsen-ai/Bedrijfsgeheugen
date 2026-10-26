import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDeletionEligibility } from '../../tools/netlify/ephemeral-janitor.mjs';

const base = {
  name: 'ephemeral-x',
  classification: 'EPHEMERAL',
  expires_at: '2026-10-01T00:00:00Z',
  custom_domains: [],
  production_alias: false,
  active_dependency: false,
  open_pr_references: [],
  release_contract_references: [],
  deletion_approved: true,
};

test('eligible only when expired and all safety guards are clear', () => {
  const result = evaluateDeletionEligibility(base, new Date('2026-10-06T00:00:00Z'));
  assert.equal(result.deleteEligible, true);
});

test('custom domain blocks deletion', () => {
  const result = evaluateDeletionEligibility({...base, custom_domains:['example.com']}, new Date('2026-10-06T00:00:00Z'));
  assert.equal(result.deleteEligible, false);
  assert.ok(result.blockers.includes('custom-domain'));
});

test('missing explicit approval blocks deletion even when expired', () => {
  const result = evaluateDeletionEligibility({...base, deletion_approved:false}, new Date('2026-10-06T00:00:00Z'));
  assert.equal(result.deleteEligible, false);
  assert.ok(result.blockers.includes('approval-required'));
});

test('non-ephemeral classes are never janitor-deletable', () => {
  const result = evaluateDeletionEligibility({...base, classification:'PROD'}, new Date('2026-10-06T00:00:00Z'));
  assert.equal(result.deleteEligible, false);
  assert.ok(result.blockers.includes('protected-class'));
});
