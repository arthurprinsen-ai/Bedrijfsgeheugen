import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_DOMAIN_OBJECT_TYPES, DOMAIN_OBJECT_TYPES, assertDomainObjectType, domainForObjectType } from '../platform/contracts/domain-types.mjs';

test('canonical domain registry contains required product families without duplicate type names', () => {
  for (const required of ['Strategy','Goal','KPI','Decision','RoadmapItem','Action','Change','Impact','Process','Capability','KnowledgeItem','System','Integration','PricePlan','Customer','AIUseCase','Agent','AgentWork']) {
    assert.ok(ALL_DOMAIN_OBJECT_TYPES.includes(required), `${required} missing`);
  }
  assert.equal(new Set(ALL_DOMAIN_OBJECT_TYPES).size, ALL_DOMAIN_OBJECT_TYPES.length);
});

test('object types resolve to exactly one canonical domain', () => {
  assert.equal(domainForObjectType('Goal'), 'STRATEGY');
  assert.equal(domainForObjectType('Integration'), 'OPERATIONS');
  assert.equal(domainForObjectType('PricePlan'), 'COMMERCIAL');
  assert.equal(domainForObjectType('AIUseCase'), 'GOVERNANCE');
});

test('unknown domain object type fails closed', () => {
  assert.throws(() => assertDomainObjectType('RandomBotMemory'), /unsupported/i);
});

test('existing models and canvases have a canonical wrapper family instead of being flattened', () => {
  assert.deepEqual(DOMAIN_OBJECT_TYPES.MODELS, ['BusinessModel','ModelVersion','FieldDefinition','Response','AIReview']);
});
