import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, DATA_CLASSES, DECISIONS, evaluatePolicy } from '../platform/policy/policy-engine.mjs';

const base = { subjectId: 'USER-1', role: 'Manager', tenantId: 'TENANT-DEMO', resourceType: 'Process', resourceId: 'PROC-1' };

test('explicit deny wins over allow', () => {
  const result = evaluatePolicy({ ...base, action: ACTIONS.VIEW, dataClass: DATA_CLASSES.CONFIDENTIAL }, [
    { id: 'allow-manager', role: 'Manager', action: ACTIONS.VIEW, resourceType: '*', decision: DECISIONS.ALLOW },
    { id: 'deny-confidential', dataClass: DATA_CLASSES.CONFIDENTIAL, action: ACTIONS.VIEW, decision: DECISIONS.DENY },
  ]);
  assert.equal(result.decision, DECISIONS.DENY);
});

test('view permission does not imply export permission', () => {
  const policies = [{ id: 'view-only', subjectId: 'USER-1', action: ACTIONS.VIEW, resourceType: 'Process', decision: DECISIONS.ALLOW }];
  assert.equal(evaluatePolicy({ ...base, action: ACTIONS.VIEW }, policies).decision, DECISIONS.ALLOW);
  assert.equal(evaluatePolicy({ ...base, action: ACTIONS.EXPORT }, policies).decision, DECISIONS.DENY);
});

test('human view permission does not imply AI processing permission', () => {
  const policies = [{ id: 'view', subjectId: 'USER-1', action: ACTIONS.VIEW, resourceType: 'Process', decision: DECISIONS.ALLOW }];
  assert.equal(evaluatePolicy({ ...base, action: ACTIONS.AI_PROCESS, purpose: 'PROCESS_OPTIMIZATION' }, policies).decision, DECISIONS.DENY);
});

test('purpose can constrain AI processing', () => {
  const policies = [{ id: 'ai-process-optimization', subjectId: 'USER-1', action: ACTIONS.AI_PROCESS, resourceType: 'Process', purpose: 'PROCESS_OPTIMIZATION', decision: DECISIONS.ALLOW }];
  assert.equal(evaluatePolicy({ ...base, action: ACTIONS.AI_PROCESS, purpose: 'PROCESS_OPTIMIZATION' }, policies).decision, DECISIONS.ALLOW);
  assert.equal(evaluatePolicy({ ...base, action: ACTIONS.AI_PROCESS, purpose: 'EMPLOYEE_PERFORMANCE_RANKING' }, policies).decision, DECISIONS.DENY);
});
