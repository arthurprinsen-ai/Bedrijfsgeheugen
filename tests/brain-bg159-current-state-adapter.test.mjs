import test from 'node:test';
import assert from 'node:assert/strict';
import { createBg159CurrentStateInput } from '../brain/operating-loop/bg159-current-state-adapter.mjs';

test('BG159 catalog item becomes source-backed CurrentState input without extra source calls', () => {
  const input=createBg159CurrentStateInput({
    tenantId:'tenant-a',
    executionId:'exec-bg159-42',
    snapshotAt:'2026-08-30T18:40:00Z',
    item:{
      id:7132648,
      n:'BG 159 - Powerhouse Cost Snapshot Collector v1',
      state:'active',
      c:33200,
      o:410,
      t:17774716,
      brain:{component_id:'make:7132648',governance_status:'GOVERNED_DISCOVERED'}
    },
    revision:'2026-08-30T18:03:01.802Z'
  });

  assert.equal(input.source,'make');
  assert.equal(input.component,'make:7132648');
  assert.equal(input.raw.scenario_id,7132648);
  assert.equal(input.raw.execution_id,'exec-bg159-42');
  assert.equal(input.raw.observed_at,'2026-08-30T18:40:00Z');
  assert.equal(input.health,'healthy');
  assert.equal(input.executionStatus,'ready');
  assert.equal(input.cost,332);
  assert.equal(input.revision,'2026-08-30T18:03:01.802Z');
  assert.equal(input.owner,'BG159');
  assert.equal(input.verified,true);
});

test('BG159 state mapping is deterministic and fail-closed on missing execution provenance', () => {
  const base={tenantId:'t',executionId:'e1',snapshotAt:'2026-08-30T18:40:00Z',item:{id:7,n:'x',c:0,o:0,t:0,brain:{component_id:'make:7'}}};
  assert.equal(createBg159CurrentStateInput({...base,item:{...base.item,state:'error'}}).health,'unhealthy');
  assert.equal(createBg159CurrentStateInput({...base,item:{...base.item,state:'paused'}}).executionStatus,'blocked');
  assert.equal(createBg159CurrentStateInput({...base,item:{...base.item,state:'inactive'}}).capacity,'inactive');
  assert.throws(()=>createBg159CurrentStateInput({...base,executionId:''}),/executionId/i);
});
