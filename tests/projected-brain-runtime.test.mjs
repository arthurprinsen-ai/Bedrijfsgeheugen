import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectedBrainRuntime} from '../platform/brain/projected-runtime.mjs';

const canonical=(id,type='ExternalSignal',tenantId='t1',data={})=>Object.freeze({id,type,tenantId,truthClass:'SourceTruth',lifecycle:'Active',version:1,verification:'Unverified',freshness:'Current',provenance:{sourceType:'Test',sourceRef:'test'},data,createdAt:'2026-08-29T20:00:00Z',updatedAt:'2026-08-29T20:00:00Z'});
function baseRuntime(){return{
 ingest:input=>({object:canonical(input.id,'ExternalSignal',input.tenantId),event:{id:'e1'}}),
 analyze:async()=>({recommendation:canonical('R1','Recommendation','t1',{text:'doe iets'}),event:{id:'e2'}}),
 recordDecision:({approved})=>({decision:canonical('D1','Decision','t1',{reason:'ok'}),change:approved?canonical('C1','Change','t1',{proposedAction:'x'}):null}),
 executeChange:async()=>({change:canonical('C1','Change','t1',{executionId:'x'}),execution:{ok:true}}),
 verifyAndLearn:()=>({change:{...canonical('C1','Change','t1',{verifiedAt:'now'}),verification:'Verified'},verification:{id:'v'},impact:{id:'i'},learning:{id:'L1',tenantId:'t1',changeId:'C1',observedImpact:'goed',recordedAt:'2026-08-29T20:01:00Z'}}),
 selfHeal:async()=>({state:'Resolved',learning:{id:'L2',tenantId:'t1',failureId:'F1',pattern:'KNOWN_SAFE_RECOVERY',recordedAt:'2026-08-29T20:02:00Z'},work:{id:'w'}}),
 snapshot:()=>({ok:true})
}}

test('projects every canonical mutation result in order',async()=>{
 const seen=[];const runtime=createProjectedBrainRuntime({runtime:baseRuntime(),projector:{project:async o=>{seen.push(`${o.type}:${o.id}`);return{stored:true}}}});
 await runtime.ingest({id:'S1',tenantId:'t1'},{actorId:'a'});
 await runtime.analyze({signalId:'S1'});
 await runtime.recordDecision({approved:true});
 await runtime.executeChange({changeId:'C1'});
 await runtime.verifyAndLearn({changeId:'C1'});
 await runtime.selfHeal({tenantId:'t1'});
 assert.deepEqual(seen,['ExternalSignal:S1','Recommendation:R1','Decision:D1','Change:C1','Change:C1','Change:C1','Learning:L1','Learning:L2']);
});

test('rejected decision projects decision but no change',async()=>{
 const ids=[];const runtime=createProjectedBrainRuntime({runtime:baseRuntime(),projector:{project:async o=>{ids.push(o.id);return{stored:true}}}});
 const result=await runtime.recordDecision({approved:false});assert.equal(result.change,null);assert.deepEqual(ids,['D1']);
});

test('projection failure is explicit and includes completed mutation result for reconciliation',async()=>{
 const mutation={object:canonical('S1'),event:{id:'e1'}};const raw=baseRuntime();raw.ingest=()=>mutation;
 const runtime=createProjectedBrainRuntime({runtime:raw,projector:{project:async()=>{throw new Error('blob unavailable')}}});
 await assert.rejects(runtime.ingest({id:'S1',tenantId:'t1'},{actorId:'a'}),e=>{assert.equal(e.code,'PORTAL_PROJECTION_FAILED');assert.equal(e.objectId,'S1');assert.equal(e.mutationResult,mutation);assert.match(e.message,/blob unavailable/);return true});
});

test('projector non-stored result is treated as visible failure unless explicitly stale-idempotent',async()=>{
 const runtime=createProjectedBrainRuntime({runtime:baseRuntime(),projector:{project:async()=>({stored:false,stale:false})}});
 await assert.rejects(runtime.ingest({id:'S1',tenantId:'t1'},{actorId:'a'}),e=>e.code==='PORTAL_PROJECTION_FAILED');
 const stale=createProjectedBrainRuntime({runtime:baseRuntime(),projector:{project:async()=>({stored:false,stale:true})}});
 await assert.doesNotReject(stale.ingest({id:'S1',tenantId:'t1'},{actorId:'a'}));
});

test('snapshot remains synchronous passthrough and wrapper exposes reconciliation helper',async()=>{
 const projected=[];const runtime=createProjectedBrainRuntime({runtime:baseRuntime(),projector:{project:async o=>{projected.push(o.id);return{stored:true}}}});
 assert.deepEqual(runtime.snapshot(),{ok:true});await runtime.reconcile([canonical('X1','Decision')]);assert.deepEqual(projected,['X1']);
});
