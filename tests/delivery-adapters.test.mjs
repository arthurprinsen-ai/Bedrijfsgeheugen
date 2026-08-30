import test from 'node:test';
import assert from 'node:assert/strict';
import { adapters } from '../platform/delivery/adapters/index.mjs';

const expected={
  github:'exact-merge-sha',
  netlify:'deploy-id-plus-commit-ref',
  make:'scenario-id-plus-lastEdit',
  notion:'object-id-plus-last-edited-version',
  supabase:'migration-or-object-state-version',
  dataforseo:'query-contract-plus-source-timestamp'
};

test('every known platform exposes the same Brain delivery adapter interface',()=>{
  assert.deepEqual(Object.keys(adapters),Object.keys(expected));
  for(const [platform,identity] of Object.entries(expected)){
    const adapter=adapters[platform];
    assert.equal(adapter.platform,platform);
    assert.equal(adapter.productionIdentity,identity);
    for(const method of ['classifyChange','validateCandidate','activate','readBack','rollback']){
      assert.equal(typeof adapter[method],'function',`${platform}.${method}`);
    }
  }
});

test('candidate validation fails closed without platform-native exact evidence',()=>{
  for(const [platform,adapter] of Object.entries(adapters)){
    assert.throws(()=>adapter.validateCandidate({platform,evidence:{}}),/evidence/i,platform);
  }
});

test('adapters return safe activation plans until a connector executor is injected',async()=>{
  const plan=await adapters.notion.activate({changeId:'chg-notion-1',candidateVersion:'rev-2'});
  assert.equal(plan.state,'ACTIVATION_READY');
  assert.equal(plan.platform,'notion');
  assert.equal(plan.executed,false);
});

test('injected executors are used without embedding credentials in adapters',async()=>{
  const output=await adapters.supabase.activate({changeId:'chg-supa-1',candidateVersion:'migration-42',execute:async input=>({ok:true,version:input.candidateVersion})});
  assert.deepEqual(output,{ok:true,version:'migration-42'});
});
