import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEdgeFunctionDomain, evaluateFunctionDeletion } from '../../tools/supabase/edge-function-registry.mjs';

test('classifies social functions deterministically', () => {
  assert.equal(classifyEdgeFunctionDomain('powerhouse-social-publisher'), 'social');
  assert.equal(classifyEdgeFunctionDomain('powerhouse-linkedin-sales-machine'), 'social');
});

test('classifies content and operations separately', () => {
  assert.equal(classifyEdgeFunctionDomain('powerhouse-content-orchestrator'), 'content');
  assert.equal(classifyEdgeFunctionDomain('supabase-migration-repair-bridge'), 'operations');
});

test('deletion requires deprecation, zero-call evidence, live replacement and approval', () => {
  const result = evaluateFunctionDeletion({
    deprecation_state: 'deprecated',
    caller_evidence: 'zero-call-window',
    replacement_live_proven: true,
    deletion_approved: true,
  });
  assert.equal(result.deleteEligible, true);
});

test('active function is never delete eligible', () => {
  const result = evaluateFunctionDeletion({
    deprecation_state: 'active',
    caller_evidence: 'zero-call-window',
    replacement_live_proven: true,
    deletion_approved: true,
  });
  assert.equal(result.deleteEligible, false);
  assert.ok(result.blockers.includes('not-deprecated'));
});
