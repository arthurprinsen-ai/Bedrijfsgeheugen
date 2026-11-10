import test from 'node:test';
import assert from 'node:assert/strict';
import {mapRuntimeProjection,loadRuntimeEvidence} from '../runtime-evidence.js';

test('a missing source health is UNKNOWN, never silently GREEN',()=>{
 const runtime=mapRuntimeProjection({
  integrationHealth:{components:[{name:'unknown'},{name:'confirmed',healthy:true},{name:'failed',healthy:false}]},
  businessGraph:{nodes:[{id:'graph-known-but-not-health-proven'}]},
  executiveCockpit:{activityTimeline:[{title:'started',status:'OK'},{title:'failed',status:'BLOCKED'}]},
  records:[{type:'Evidence',id:'r1',status:'OBSERVED'}],
  aiGovernance:{systems:[{systemName:'unknown-risk'},{systemName:'low-risk',riskLevel:'LOW'},{systemName:'high-risk',riskLevel:'HIGH'}]}
 });
 assert.deepEqual(runtime.sources.items.map(x=>[x.status,x.healthy]),[['open',false],['ok',true],['aandacht',false]]);
 assert.equal(runtime.datahub.items[0].healthy,false,'a graph node is not a verified successful execution');
 assert.deepEqual(runtime.agents.items.map(x=>x.status),['open','aandacht']);
 assert.equal(runtime.audit.items[0].healthy,false,'the existence of an event is not outcome proof');
 assert.deepEqual(runtime.governance.items.map(x=>x.status),['open','open','aandacht']);
});

test('revoked or unavailable original Brain readback clears old projection and triggers one invalidation',async()=>{
 const originalEvent=globalThis.CustomEvent,originalDispatch=globalThis.dispatchEvent;
 const events=[];
 globalThis.CustomEvent=class {constructor(type,{detail}){this.type=type;this.detail=detail;}};
 globalThis.dispatchEvent=event=>events.push(event);
 let stored={sources:{items:[{status:'ok',healthy:true}]}};
 const domainState={get:path=>path==='portal.runtime'?stored:null,setDerived:(path,value)=>{assert.equal(path,'portal.runtime');stored=value;}};
 const opts={domainState,authHeadersProvider:async()=>({authorization:'Bearer valid-session'}),
  validateSession:()=>true,fetchImpl:async()=>({ok:false,status:401})};
 try{
  assert.equal(await loadRuntimeEvidence(opts),null);
  assert.equal(stored,null);
  assert.equal(events.length,1);
  assert.equal(events[0].type,'bg:runtime-evidence');
  assert.deepEqual(events[0].detail,{source:'brain-operating-loop',state:'UNVERIFIED',reason:'AUTH_REVOKED'});
  assert.equal(await loadRuntimeEvidence(opts),null);
  assert.equal(events.length,1,'unchanged unauthorized state must not emit repeated invalidation');
  stored={sources:{items:[{status:'ok',healthy:true}]}};
  assert.equal(await loadRuntimeEvidence({...opts,fetchImpl:async()=>({ok:false,status:503})}),null);
  assert.equal(stored,null);
  assert.equal(events.at(-1).detail.reason,'SOURCE_UNAVAILABLE');
  stored={sources:{items:[{status:'ok',healthy:true}]}};
  assert.equal(await loadRuntimeEvidence({...opts,fetchImpl:async()=>{throw Error('offline');}}),null);
  assert.equal(stored,null);
  stored={sources:{items:[{status:'ok',healthy:true}]}};
  const n=events.length;
  assert.equal(await loadRuntimeEvidence({...opts,validateSession:()=>false}),null);
  assert.notEqual(stored,null,'stale response from prior identity must never mutate current tenant overlay');
  assert.equal(events.length,n);
 }finally{
  if(originalEvent===undefined)delete globalThis.CustomEvent;else globalThis.CustomEvent=originalEvent;
  if(originalDispatch===undefined)delete globalThis.dispatchEvent;else globalThis.dispatchEvent=originalDispatch;
 }
});

test('missing bearer clears a previously visible runtime without attempting a provider call',async()=>{
 let stored={sources:{items:[{healthy:true}]}},calls=0;
 const result=await loadRuntimeEvidence({domainState:{get:()=>stored,setDerived:(_path,value)=>{stored=value;}},
  authHeadersProvider:async()=>({}),fetchImpl:async()=>{calls++;return {ok:true};}});
 assert.equal(result,null);assert.equal(stored,null);assert.equal(calls,0);
});
