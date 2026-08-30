import test from 'node:test';
import assert from 'node:assert/strict';
import { createBg159CurrentStateInputs } from '../brain/operating-loop/bg159-current-state-batch.mjs';

test('one BG159 snapshot maps the whole catalog with one shared execution provenance', () => {
  const inputs=createBg159CurrentStateInputs({
    tenantId:'tenant-a',
    executionId:'exec-bg159-99',
    snapshot:{
      at:'2026-08-30T18:45:00Z',
      catalog:[
        {id:10,n:'A',state:'active',c:120,lastEdit:'2026-08-30T17:00:00Z',brain:{component_id:'make:10'}},
        {id:11,n:'B',state:'error',c:50,lastEdit:'2026-08-30T17:05:00Z',brain:{component_id:'make:11'}}
      ]
    }
  });
  assert.equal(inputs.length,2);
  assert.deepEqual(inputs.map(x=>x.raw.execution_id),['exec-bg159-99','exec-bg159-99']);
  assert.deepEqual(inputs.map(x=>x.component),['make:10','make:11']);
  assert.equal(inputs[0].cost,1.2);
  assert.equal(inputs[1].health,'unhealthy');
  assert.equal(inputs[1].revision,'2026-08-30T17:05:00Z');
});

test('batch accepts snapshot_at and rejects duplicate scenario identities', () => {
  const base={tenantId:'t',executionId:'e',snapshot:{snapshot_at:'2026-08-30T18:45:00Z',catalog:[{id:1,state:'active',brain:{component_id:'make:1'}}]}};
  assert.equal(createBg159CurrentStateInputs(base)[0].raw.observed_at,'2026-08-30T18:45:00Z');
  assert.throws(()=>createBg159CurrentStateInputs({...base,snapshot:{...base.snapshot,catalog:[base.snapshot.catalog[0],base.snapshot.catalog[0]]}}),/duplicate/i);
});

test('batch fails closed without a catalog, snapshot time or execution provenance', () => {
  assert.throws(()=>createBg159CurrentStateInputs({tenantId:'t',executionId:'e',snapshot:{at:'2026-08-30T18:45:00Z'}}),/catalog/i);
  assert.throws(()=>createBg159CurrentStateInputs({tenantId:'t',executionId:'e',snapshot:{catalog:[]}}),/snapshot/i);
  assert.throws(()=>createBg159CurrentStateInputs({tenantId:'t',executionId:'',snapshot:{at:'2026-08-30T18:45:00Z',catalog:[]}}),/executionId/i);
});
