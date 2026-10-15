import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainState} from '../domain-state.js';
import {loadRuntimeEvidence} from '../runtime-evidence.js';

const copy=x=>structuredClone(x);
test('authenticated Brain runtime is visible to Foresight but never persisted by a later edit',async()=>{
 const writes=[];
 const state=createDomainState({
  load:async()=>({portal:{profile:{name:'Tenant A'},goal_history:{revenue_growth:[]}}}),
  save:async candidate=>{writes.push(copy(candidate));return copy(candidate);}
 });
 await state.init();
 const seen=[];
 state.subscribe(s=>seen.push(s.state.portal?.runtime?.observability?.source||null));
 const runtime={observability:{source:'brain-operating-loop',updatedAt:'2026-10-15T19:00:00Z',events:[{id:'event-a'}]}};
 state.setDerived('portal.runtime',runtime);
 assert.equal(state.status(),'idle');
 assert.equal(state.get('portal.runtime.observability.source'),'brain-operating-loop');
 assert.equal(state.get().portal.runtime.observability.events.length,1);
 assert.ok(seen.includes('brain-operating-loop'));
 state.set('portal.profile.name','Changed');
 await state.flush();
 assert.equal(writes.length,1);
 assert.equal(writes[0].portal.runtime,undefined,'derived runtime must not be saved');
 assert.equal(writes[0].portal.profile.name,'Changed');
 assert.equal(state.get('portal.runtime.observability.source'),'brain-operating-loop');
 await state.init();
 assert.equal(state.get('portal.runtime'),undefined,'switch/reload must clear derived runtime');
});

test('historically persisted runtime is never exposed or re-saved as current',async()=>{
 const writes=[];
 const old={portal:{runtime:{observability:{source:'brain-operating-loop',updatedAt:'2025-01-01T00:00:00Z'}},profile:{name:'A'}}};
 const state=createDomainState({load:async()=>copy(old),save:async row=>{writes.push(copy(row));return row;}});
 await state.init();
 assert.equal(state.get('portal.runtime'),undefined);
 state.set('portal.profile.name','B');
 await state.flush();
 assert.equal(writes.at(-1).portal.runtime,undefined);
});

test('derived state is restricted to runtime and accepts null for revocation',async()=>{
 const state=createDomainState({load:async()=>({}),save:async row=>row});
 await state.init();
 assert.throws(()=>state.setDerived('portal.profile',{name:'forged'}),/DOMAIN_DERIVED_PATH_NOT_ALLOWED/);
 assert.throws(()=>state.setDerived('portal.runtime','text'),/DOMAIN_DERIVED_RUNTIME_OBJECT_REQUIRED/);
 state.setDerived('portal.runtime',{observability:{source:'brain-operating-loop'}});
 assert.ok(state.get('portal.runtime'));
 state.setDerived('portal.runtime',null);
 assert.equal(state.get('portal.runtime'),undefined);
 assert.equal(state.status(),'idle');
});

test('unauthenticated runtime request is never fetched or installed in portal state',async()=>{
 let calls=0,installed=0;
 const fetchImpl=async()=>{calls++;return Response.json({records:[]});};
 const domainState={setDerived:()=>installed++};
 const noAuth=await loadRuntimeEvidence({fetchImpl,domainState,authHeadersProvider:async()=>({})});
 assert.equal(noAuth,null);
 assert.equal(calls,0);
 assert.equal(installed,0);
 const demo=await loadRuntimeEvidence({fetchImpl,domainState,authHeadersProvider:async()=>({accept:'application/json'})});
 assert.equal(demo,null);
 assert.equal(calls,0);
});

test('authenticated Brain projection publishes derived runtime without mutation of canonical state',async()=>{
 const store=createDomainState({load:async()=>({portal:{profile:{name:'Tenant A'}}}),save:async row=>row});
 await store.init();
 let calls=0;
 const runtime=await loadRuntimeEvidence({
  fetchImpl:async()=>{calls++;return Response.json({records:[{id:'E1',type:'Evidence',observedAt:new Date().toISOString()}],integrationHealth:{components:[{name:'CRM',healthy:true}]}});},
  domainState:store,
  authHeadersProvider:async()=>({authorization:'Bearer test-token'})
 });
 assert.equal(calls,1);
 assert.equal(runtime.observability.source,'brain-operating-loop');
 assert.equal(store.get('portal.runtime.observability.source'),'brain-operating-loop');
 assert.equal(store.status(),'idle');
 assert.equal(store.get('portal.profile.name'),'Tenant A');
});
