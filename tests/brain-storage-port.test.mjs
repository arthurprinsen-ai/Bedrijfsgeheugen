import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrainRuntime } from '../platform/brain/runtime.mjs';
import { createProviderRegistry } from '../platform/intelligence/provider-registry.mjs';

function fakeStore() {
  const events = [];
  return {
    append(event) { events.push(event); return event; },
    all() { return [...events]; },
    byObject(objectId) { return events.filter(event => event.objectId === objectId); },
    byCorrelation(correlationId) { return events.filter(event => event.correlationId === correlationId); },
  };
}

function deps(eventStore) {
  return {
    eventStore,
    providerRegistry:createProviderRegistry([{ id:'MODEL', provider:'test', model:'test', status:'Approved', allowedDataClasses:['Public'], allowedPurposes:['test'], trainingAllowed:false, persistentProviderMemory:false }]),
    aiProvider:{ analyze:async () => ({ text:'x', confidence:1, evidenceRefs:['x'] }) },
    executor:{ execute:async () => ({ ok:true, executionId:'x' }) },
  };
}

test('Brain Runtime writes canonical events to an injected event store', () => {
  const store = fakeStore();
  const brain = createBrainRuntime(deps(store));
  const result = brain.ingest({ id:'SIG-1', tenantId:'TENANT-1', type:'ExternalSignal', provenance:{ sourceType:'Test', sourceRef:'test:1' }, idempotencyKey:'source:test:1', value:42 }, { actorId:'source-adapter' });
  assert.equal(store.all().length, 1);
  assert.equal(store.all()[0].eventId, result.event.eventId);
  assert.equal(brain.snapshot().events.length, 1);
});

test('Brain Runtime rejects an incomplete event-store adapter', () => {
  assert.throws(() => createBrainRuntime(deps({ append() {} })), /eventStore/i);
});
