import test from 'node:test';
import assert from 'node:assert/strict';
import { projectLivingMemory, verifiedMemoryOutcome } from '../brain/operating-loop/living-memory.mjs';

const now='2026-10-22T17:00:00Z';
const evidence={id:'ev-1',tenantId:'tenant-a',kind:'evidence',verified:true,observedAt:now};
const outcome={id:'out-1',tenantId:'tenant-a',kind:'outcome',executed:true,verified:true,owner:'agent:verification',result:'delivered',evidenceIds:['ev-1'],observedAt:now};
const memory={id:'mem-1',tenantId:'tenant-a',kind:'memory',status:'PROVEN',verified:true,evidenceIds:['ev-1'],predecessorIds:['out-1'],observedAt:now};

test('same-tenant source, verified outcome and real evidence permit PROVEN',()=>{
  assert.deepEqual(verifiedMemoryOutcome(memory,[evidence,outcome,memory]),{outcomeId:'out-1',evidenceIds:['ev-1']});
  const projected=projectLivingMemory([evidence,outcome,memory],{now});
  assert.equal(projected.memories[0].status,'PROVEN');
  assert.equal(projected.memories[0].proof.state,'PROVEN');
  assert.equal(projected.memories[0].proof.outcomeId,'out-1');
});

test('source PROVEN without real proof is never projected as proven',()=>{
  const bad=[
    {...memory,evidenceIds:[]},
    {...memory,verified:false},
    {...memory,predecessorIds:['unknown']},
    {...memory,tenantId:'tenant-b'},
    {...memory,status:'OBSERVED'},
  ];
  for(const x of bad){
    assert.equal(verifiedMemoryOutcome(x,[evidence,outcome,x]),null);
  }
  for(const x of bad.filter(x=>x.status==='PROVEN')){
    const result=projectLivingMemory([evidence,outcome,x],{now});
    assert.equal(result.memories[0].status,'REVIEW_REQUIRED');
    assert.equal(result.memories[0].proof.state,'REVIEW_REQUIRED');
  }
});

test('cross-tenant, missing outcome readback and mismatched evidence cannot fake green',()=>{
  const invalid=[
    {...outcome,tenantId:'tenant-b'},
    {...outcome,verified:false},
    {...outcome,executed:false},
    {...outcome,result:null},
    {...outcome,evidenceIds:['ev-other']}
  ];
  for(const x of invalid){
    assert.equal(verifiedMemoryOutcome(memory,[evidence,x,memory]),null);
    assert.equal(projectLivingMemory([evidence,x,memory],{now}).memories[0].status,'REVIEW_REQUIRED');
  }
  assert.equal(verifiedMemoryOutcome(memory,[{...evidence,verified:false},outcome,memory]),null);
  assert.equal(verifiedMemoryOutcome(memory,[{...evidence,tenantId:'tenant-b'},outcome,memory]),null);
});

test('downgrade is projection-only and cannot mutate stored source records',()=>{
  const original={...memory};
  const records=[evidence,outcome,{...memory,predecessorIds:['missing-outcome']}];
  const projected=projectLivingMemory(records,{now});
  assert.equal(records[2].status,'PROVEN');
  assert.equal(original.status,'PROVEN');
  assert.equal(projected.memories[0].status,'REVIEW_REQUIRED');
  assert.equal(projected.records.find(x=>x.id==='mem-1').proof.state,'REVIEW_REQUIRED');
});
