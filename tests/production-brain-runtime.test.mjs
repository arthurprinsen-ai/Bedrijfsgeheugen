import test from 'node:test';
import assert from 'node:assert/strict';
import {createProductionBrainRuntime} from '../platform/brain/production-runtime.mjs';

test('production factory requires canonical portal projection store',()=>{assert.throws(()=>createProductionBrainRuntime({}),/portalProjectionStore/)});

test('production factory returns projected runtime with async mutation boundary',async()=>{
 const layers=new Map();
 const store={getLayer:async(t,l)=>layers.get(`${t}:${l}`)||null,putCanonical:async(t,p)=>{layers.set(`${t}:canonical-brain`,p);return{stored:true,record:p}}};
 const providerRegistry={assertAllowed:()=>({allowed:true})};
 const runtime=createProductionBrainRuntime({portalProjectionStore:store,providerRegistry,aiUseCases:[],contextPolicy:{},aiProvider:{analyze:async()=>({text:'x',confidence:.9,evidenceRefs:['e']})},executor:{execute:async()=>({ok:true,executionId:'x'})},policies:[]});
 const p=runtime.ingest({id:'S1',tenantId:'t1',provenance:{sourceType:'API',sourceRef:'src'},idempotencyKey:'i1'},{actorId:'a'});
 assert.equal(typeof p.then,'function');await p;
 assert.ok(layers.get('t1:canonical-brain')?.data?.signals?.some(x=>x.id==='S1'));
});
