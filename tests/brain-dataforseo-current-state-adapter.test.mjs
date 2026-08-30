import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataForSeoCurrentStateInput } from '../brain/operating-loop/dataforseo-current-state-adapter.mjs';

test('maps completed DataForSEO task evidence into canonical CurrentState input',()=>{
  const input=createDataForSeoCurrentStateInput({
    tenantId:'tenant-a',
    taskId:'task-123',
    keyword:'bedrijfsgeheugen',
    locationCode:'2528',
    taskState:'completed',
    observedAt:'2026-08-30T18:40:00Z',
    resultCount:100
  });
  assert.equal(input.source,'dataforseo');
  assert.equal(input.id,'dataforseo-current-state:task-123:2528:bedrijfsgeheugen');
  assert.equal(input.component,'dataforseo:2528:bedrijfsgeheugen');
  assert.equal(input.raw.task_id,'task-123');
  assert.equal(input.raw.keyword,'bedrijfsgeheugen');
  assert.equal(input.raw.location_code,'2528');
  assert.equal(input.raw.observed_at,'2026-08-30T18:40:00Z');
  assert.equal(input.health,'healthy');
  assert.equal(input.executionStatus,'completed');
  assert.equal(input.capacity,'available');
  assert.equal(input.verified,true);
});

test('maps processing and failed task states deterministically',()=>{
  const base={tenantId:'tenant-a',taskId:'task-1',keyword:'seo',locationCode:'2528',observedAt:'2026-08-30T18:40:00Z'};
  const running=createDataForSeoCurrentStateInput({...base,taskState:'processing'});
  assert.equal(running.health,'healthy');
  assert.equal(running.executionStatus,'running');
  const failed=createDataForSeoCurrentStateInput({...base,taskId:'task-2',taskState:'failed',errorMessage:'remote error'});
  assert.equal(failed.health,'unhealthy');
  assert.equal(failed.executionStatus,'failed');
  assert.equal(failed.error,'DATAFORSEO_TASK_FAILED');
});

test('fails closed without registered DataForSEO provenance fields',()=>{
  assert.throws(()=>createDataForSeoCurrentStateInput({tenantId:'tenant-a'}),/taskId/);
  assert.throws(()=>createDataForSeoCurrentStateInput({tenantId:'tenant-a',taskId:'task'}),/keyword/);
  assert.throws(()=>createDataForSeoCurrentStateInput({tenantId:'tenant-a',taskId:'task',keyword:'seo'}),/locationCode/);
  assert.throws(()=>createDataForSeoCurrentStateInput({tenantId:'tenant-a',taskId:'task',keyword:'seo',locationCode:'2528'}),/observedAt/);
});
