import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGrowthLearningEngine} from './learning-store.mjs';
const outcome={actionId:'a',evidenceId:'e',result:'WIN'};
test('rejects prior-read fence callback as insufficient',async()=>{
 assert.throws(()=>makeGrowthLearningEngine({get:async()=>undefined,assertLegacyWriterFenced:async()=>({fenced:true})}),/ATOMIC_PERSISTENT_STORE_REQUIRED/);
});
test('rejects ambiguous transaction ACK',async()=>{
 const engine=makeGrowthLearningEngine({get:async()=>undefined,insertIfAbsentWithCutoverFence:async()=>({status:'INSERTED'})});
 await assert.rejects(()=>engine.recordOutcome(outcome),/ATOMIC_CUTOVER_ACK_REQUIRED/);
});
test('atomic inserted ACK succeeds',async()=>{
 const engine=makeGrowthLearningEngine({get:async()=>undefined,insertIfAbsentWithCutoverFence:async()=>({status:'INSERTED',epoch:'db-epoch-4',scope:'growth:outcome',key:'growth:outcome:v2:a:e',legacyKey:'growth:outcome:a:e',transactionVerified:true})});
 assert.equal((await engine.recordOutcome(outcome)).status,'RECORDED');
});
test('duplicate needs independent readback and content match',async()=>{
 const store={get:async()=>({...outcome,result:'LOSE'}),insertIfAbsentWithCutoverFence:async()=>({status:'LEGACY_EXISTS',epoch:'4',scope:'growth:outcome',key:'growth:outcome:v2:a:e',legacyKey:'growth:outcome:a:e',transactionVerified:true})};
 await assert.rejects(()=>makeGrowthLearningEngine(store).recordOutcome(outcome),/IDEMPOTENCY_KEY_CONFLICT/);
});
test('concurrent calls one insert and other duplicate',async()=>{
 const db=new Map();
 const store={get:async k=>db.get(k),insertIfAbsentWithCutoverFence:async({legacyKey,key,record})=>{
  if(db.has(legacyKey))return {status:'LEGACY_EXISTS',epoch:'4',scope:'growth:outcome',key,legacyKey,transactionVerified:true};
  if(db.has(key))return {status:'V2_EXISTS',epoch:'4',scope:'growth:outcome',key,legacyKey,transactionVerified:true};
  db.set(key,record);return {status:'INSERTED',epoch:'4',scope:'growth:outcome',key,legacyKey,transactionVerified:true};
 }};
 const results=await Promise.all(Array.from({length:20},()=>makeGrowthLearningEngine(store).recordOutcome(outcome)));
 assert.equal(results.filter(x=>x.status==='RECORDED').length,1);
 assert.equal(results.filter(x=>x.status==='DUPLICATE').length,19);
});

test('rejects mismatched transaction receipt',async()=>{
 const store={get:async()=>undefined,insertIfAbsentWithCutoverFence:async()=>({status:'INSERTED',epoch:'4',scope:'other',key:'wrong',legacyKey:'wrong',transactionVerified:true})};
 await assert.rejects(()=>makeGrowthLearningEngine(store).recordOutcome(outcome),/ATOMIC_CUTOVER_ACK_REQUIRED/);
});
test('rejects advisory-only unverified receipt',async()=>{
 const store={get:async()=>undefined,insertIfAbsentWithCutoverFence:async()=>({status:'INSERTED',epoch:'4',scope:'growth:outcome',key:'growth:outcome:v2:a:e',legacyKey:'growth:outcome:a:e'})};
 await assert.rejects(()=>makeGrowthLearningEngine(store).recordOutcome(outcome),/ATOMIC_CUTOVER_ACK_REQUIRED/);
});
