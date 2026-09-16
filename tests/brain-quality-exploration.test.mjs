import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExplorationAction, normalizeCandidateFinding } from '../scripts/brain/quality/exploration-policy.mjs';

test('bounded exploration rejects destructive actions and budget overflow', () => {
  assert.equal(evaluateExplorationAction({ action: 'delete_account', stepsUsed: 0, maxSteps: 10 }).allowed, false);
  assert.equal(evaluateExplorationAction({ action: 'click', stepsUsed: 10, maxSteps: 10 }).allowed, false);
  assert.equal(evaluateExplorationAction({ action: 'click', stepsUsed: 2, maxSteps: 10 }).allowed, true);
});

test('AI exploration findings remain advisory until deterministic reproduction exists', () => {
  const finding = normalizeCandidateFinding({ kind: 'layout', description: 'clipping', source: 'ai_explorer' });
  assert.equal(finding.type, 'candidate_finding');
  assert.equal(finding.release_authority, false);
  assert.equal(finding.evidence_state, 'UNKNOWN');
});
