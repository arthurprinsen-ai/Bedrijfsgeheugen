import test from 'node:test';
import assert from 'node:assert/strict';
import { toBrainCostEvent } from '../platform/cost/brain-cost-events.mjs';
import { validateLearningEvent } from '../scripts/team-memory/validate-event.mjs';

test('cost event carries Brain lineage and aggregate evidence but strips raw context', () => {
  const event = toBrainCostEvent({
    type: 'OUTCOME',
    componentKey: 'make:159',
    traceId: 'T1',
    correlationId: 'C1',
    parentEventId: 'P1',
    fingerprint: 'cost|159|2026-08-30',
    before: { credits: 135, operations: 20 },
    after: { credits: 60, operations: 8 },
    protectedMetrics: { production: true, security: true },
    evidence: ['MAKE-METER:159'],
    confidence: 0.93,
    rawPrompt: 'SECRET',
    dmContent: 'PRIVATE',
  });

  assert.equal(event.schema_version, 'brain.v1');
  assert.equal(event.trace_id, 'T1');
  assert.equal(event.correlation_id, 'C1');
  assert.equal(event.parent_event_id, 'P1');
  assert.deepEqual(event.before, { credits: 135, operations: 20 });
  assert.equal(JSON.stringify(event).includes('SECRET'), false);
  assert.equal(JSON.stringify(event).includes('PRIVATE'), false);
  assert.deepEqual(validateLearningEvent(event), { valid: true, errors: [] });
});

test('Brain cost events reject missing lineage and unsupported types', () => {
  assert.throws(() => toBrainCostEvent({
    type: 'OUTCOME', componentKey: 'make:159', fingerprint: 'fp', correlationId: 'C1',
  }), /traceId/);
  assert.throws(() => toBrainCostEvent({
    type: 'RAW_PROMPT', componentKey: 'make:159', fingerprint: 'fp', traceId: 'T1', correlationId: 'C1',
  }), /unsupported Brain cost event type/);
});

test('legacy shared-memory event validation remains unchanged', () => {
  const result = validateLearningEvent({
    type: 'ERROR', source: 'github', component: 'preview-build',
    fingerprint: 'github|preview-build|build-error', severity: 'error',
    owner_agent: '09', action: 'repair preview build',
    verification: 'build and preview green', rollback: 'restore last-known-good',
  });

  assert.deepEqual(result, { valid: true, errors: [] });
});
