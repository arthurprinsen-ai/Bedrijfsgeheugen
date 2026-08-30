import test from 'node:test';
import assert from 'node:assert/strict';
import { createIntegrationCurrentState, createIntegrationCurrentStateFromSource } from '../brain/operating-loop/integration-current-state.mjs';

test('creates canonical CurrentState telemetry envelope for any registered platform', () => {
  const record=createIntegrationCurrentState({
    tenantId:'tenant-a',
    platform:'make',
    component:'BG139',
    observedAt:'2026-08-30T18:10:00Z',
    health:'degraded',
    error:'quota',
    owner:'agent-reliability',
    cost:12.5,
    revision:'rev-42',
    capacity:'quota_exceeded',
    executionStatus:'blocked',
    sourceId:'execution-123',
    verified:true
  });

  assert.equal(record.schemaVersion,'brain-record.v1');
  assert.equal(record.type,'CurrentState');
  assert.equal(record.kind,'current_state');
  assert.equal(record.tenantId,'tenant-a');
  assert.equal(record.subjectId,'integration:make:BG139');
  assert.equal(record.provenance.source,'make');
  assert.equal(record.provenance.sourceId,'execution-123');
  assert.equal(record.payload.integration.platform,'make');
  assert.equal(record.payload.integration.component,'BG139');
  assert.equal(record.payload.integration.health,'degraded');
  assert.equal(record.payload.integration.cost,12.5);
  assert.equal(record.payload.integration.capacity,'quota_exceeded');
  assert.equal(record.payload.integration.execution_status,'blocked');
  assert.equal(record.payload.integration.last_verified_at,'2026-08-30T18:10:00Z');
  assert.equal(record.verified,true);
  assert.equal(record.executed,false);
});

test('producer fails closed when tenant, platform or component identity is missing', () => {
  assert.throws(()=>createIntegrationCurrentState({platform:'github',component:'repo'}),/tenantId/i);
  assert.throws(()=>createIntegrationCurrentState({tenantId:'t',component:'repo'}),/platform/i);
  assert.throws(()=>createIntegrationCurrentState({tenantId:'t',platform:'github'}),/component/i);
});

test('source-backed producer reuses registered source identity and freshness mappings', () => {
  const record=createIntegrationCurrentStateFromSource({
    tenantId:'tenant-a',
    source:'make',
    id:'make-bg139-state',
    component:'BG139',
    raw:{scenario_id:'7148743',execution_id:'exec-9',observed_at:'2026-08-30T18:20:00Z'},
    health:'healthy',
    owner:'BG159',
    revision:'scenario-v12',
    executionStatus:'ready',
    verified:true
  });

  assert.equal(record.type,'CurrentState');
  assert.equal(record.provenance.source,'make');
  assert.equal(record.provenance.sourceId,'7148743:exec-9');
  assert.equal(record.observedAt,'2026-08-30T18:20:00Z');
  assert.equal(record.subjectId,'integration:make:BG139');
  assert.deepEqual(record.payload.raw,{scenario_id:'7148743',execution_id:'exec-9',observed_at:'2026-08-30T18:20:00Z'});
  assert.equal(record.payload.mappingVersion,'v1');
  assert.equal(record.payload.integration.health,'healthy');
});

test('source-backed producer inherits fail-closed source and identity rules', () => {
  assert.throws(()=>createIntegrationCurrentStateFromSource({tenantId:'t',source:'unknown',id:'x',component:'c',raw:{}}),/Unknown Brain source/);
  assert.throws(()=>createIntegrationCurrentStateFromSource({tenantId:'t',source:'github',id:'x',component:'repo',raw:{repository:'r'}}),/identity incomplete/);
});
