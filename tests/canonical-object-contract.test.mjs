import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUTH_CLASSES, LIFECYCLE_STATES, createCanonicalObject, assertCanonicalObject,
} from '../platform/contracts/canonical-object.mjs';
import {
  RELATION_KINDS, CAUSALITY_LEVELS, createRelationship, assertRelationship,
} from '../platform/contracts/relationship.mjs';

test('canonical object requires immutable identity, tenant scope, provenance and version', () => {
  const object = createCanonicalObject({
    id: 'GOAL-001', type: 'Goal', tenantId: 'TENANT-DEMO',
    truthClass: TRUTH_CLASSES.BUSINESS_TRUTH,
    lifecycle: LIFECYCLE_STATES.ACTIVE,
    version: 1,
    provenance: { sourceType: 'bedrijfsgeheugen', sourceRef: 'strategy/goals/1' },
    data: { title: 'Grow recurring revenue' },
  });
  assert.equal(assertCanonicalObject(object), true);
  assert.equal(object.id, 'GOAL-001');
  assert.equal(object.tenantId, 'TENANT-DEMO');
  assert.equal(Object.isFrozen(object), true);
});

test('AI interpretation cannot be constructed without provenance', () => {
  assert.throws(() => createCanonicalObject({
    id: 'FINDING-1', type: 'Finding', tenantId: 'TENANT-DEMO',
    truthClass: TRUTH_CLASSES.AI_INTERPRETATION,
    lifecycle: LIFECYCLE_STATES.DRAFT,
    version: 1,
    data: { text: 'possible risk' },
  }), /provenance/i);
});

test('working and active are represented by lifecycle/versioned objects, never a hidden overwrite', () => {
  const base = { id: 'STR-1', type: 'Strategy', tenantId: 'TENANT-DEMO', truthClass: TRUTH_CLASSES.BUSINESS_TRUTH,
    version: 3, provenance: { sourceType: 'bedrijfsgeheugen', sourceRef: 'strategy/1' }, data: {} };
  const active = createCanonicalObject({ ...base, lifecycle: LIFECYCLE_STATES.ACTIVE });
  const working = createCanonicalObject({ ...base, id: 'STR-1-W4', version: 4, lifecycle: LIFECYCLE_STATES.DRAFT });
  assert.notEqual(active.id, working.id);
  assert.equal(active.lifecycle, 'Active');
  assert.equal(working.lifecycle, 'Draft');
});

test('relationship is first-class, tenant scoped and provenance aware', () => {
  const rel = createRelationship({
    id: 'REL-1', tenantId: 'TENANT-DEMO', fromId: 'PROC-1', toId: 'SYS-1',
    kind: RELATION_KINDS.USES, confidence: 1,
    provenance: { sourceType: 'bedrijfsgeheugen', sourceRef: 'process/1' },
  });
  assert.equal(assertRelationship(rel), true);
  assert.equal(rel.kind, 'USES');
});

test('causal relation must declare causality level and bounded confidence', () => {
  assert.throws(() => createRelationship({
    id: 'REL-2', tenantId: 'TENANT-DEMO', fromId: 'CHG-1', toId: 'KPI-1',
    kind: RELATION_KINDS.CONTRIBUTES_TO, confidence: 1.2,
    causality: CAUSALITY_LEVELS.LIKELY_CAUSES,
    provenance: { sourceType: 'analysis', sourceRef: 'impact/1' },
  }), /confidence/i);
});
