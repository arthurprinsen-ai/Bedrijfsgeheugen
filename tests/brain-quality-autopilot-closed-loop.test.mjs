import test from 'node:test';
import assert from 'node:assert/strict';

import { discoverQualitySurfaces } from '../scripts/brain/quality/surface-discovery.mjs';

async function requiredModule(relativePath) {
  try { return await import(relativePath); }
  catch (error) { assert.fail(`required Quality Autopilot module missing: ${relativePath}: ${error.message}`); }
}

test('critical journeys are discovered from the canonical source marker', () => {
  const discovered = discoverQualitySurfaces({
    files: [{
      path: 'tests/e2e/revenue-flow.spec.mjs',
      content: '// quality-critical-journey: action-provider-readback-outcome-learning\n',
    }],
  });
  assert.deepEqual(
    discovered.filter(item => item.type === 'critical_journey').map(item => item.id),
    ['critical_journey:action-provider-readback-outcome-learning'],
  );
});

test('quality learning payload targets BRAIN-CLOSED-LOOP-v1 and never invents a parallel store', async () => {
  const { buildQualityLearningPayload, evaluateLearningReadback } = await requiredModule('../scripts/brain/quality/learning-writeback.mjs');
  const payload = buildQualityLearningPayload({
    defect: { id: 'd-1', fingerprint: 'fp-1', surface_id: 'api:/score', evidence: 'prod-readback-1' },
    rootCause: 'missing tenant invariant',
    preventionRule: 'require tenant parity before green',
    regressionCandidate: { state: 'PROVEN_REGRESSION', defect_id: 'd-1' },
  });
  assert.equal(payload.fingerprint, 'BRAIN-CLOSED-LOOP-v1');
  assert.equal(payload.canonical_targets.learning_router, '7136176');
  assert.equal(payload.canonical_targets.outcome_audit, '7136188');
  assert.equal(payload.canonical_targets.context_retrieval, '7136196');
  assert.equal(payload.prevention_route, 'regression_test');
  assert.equal(payload.parallel_learning_store, false);
  assert.equal(payload.dedupe_key, 'escaped_defect|api:/score|add_proven_regression_prevention|powerhouse-quality');
  assert.equal(evaluateLearningReadback({ learning_write_ok: false, readback_ok: false, new_context_visible: false }).status, 'WRITEBACK_REQUIRED');
  assert.equal(evaluateLearningReadback({ learning_write_ok: true, readback_ok: false, new_context_visible: false }).status, 'READBACK_REQUIRED');
  assert.equal(evaluateLearningReadback({ learning_write_ok: true, readback_ok: true, new_context_visible: false }).status, 'CONTEXT_NOT_VISIBLE');
  assert.equal(evaluateLearningReadback({ learning_write_ok: true, readback_ok: true, new_context_visible: true }).status, 'LEARNED');
});

test('learning writeback adapter reports canonical runtime unregistered instead of pretending persistence', async () => {
  const { prepareQualityLearningWriteback } = await requiredModule('../scripts/brain/quality/learning-writeback.mjs');
  const result = prepareQualityLearningWriteback({ payload: { fingerprint: 'BRAIN-CLOSED-LOOP-v1' }, callableInterface: null });
  assert.equal(result.status, 'WRITEBACK_REQUIRED');
  assert.equal(result.reason, 'canonical_learning_runtime_not_callable_in_repository');
  assert.equal(result.persisted, false);
});
