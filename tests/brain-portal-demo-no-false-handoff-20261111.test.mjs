import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalDomainState} from '../portal-v2/domain-state.js';

test('temporary demonstration values never create consumer-ACK obligations',async()=>{
 let state={portal:{strategy:{horizon:'2027',dna:{ambitie:'begin'}}}};
 let durablePosts=0;
 const client={
  isDemo:()=>true,
  currentUser:()=>({id:'DEMO_ONLY'}),
  authHeaders:async()=>({accept:'application/json'}),
  load:async()=>({mode:'authenticated',state:structuredClone(state)}),
  write:async value=>({mode:'authenticated',state:state=structuredClone(value)})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{
  durablePosts++;return {stored:true};
 }});
 await domain.init();
 const original=structuredClone(domain.get());
 domain.set('portal.strategy.horizon','2030');
 domain.set('portal.strategy.dna.ambitie','duurzaam groeien');
 assert.deepEqual(domain.pendingHandoffs(),{pending:false,inputs:0,impacts:0,retryable:false});
 await domain.flush();
 assert.equal(domain.status(),'saved');
 assert.equal(domain.get('portal.strategy.dna.ambitie'),'duurzaam groeien');
 domain.set('',original);
 await domain.flush();
 assert.deepEqual(domain.get(),original);
 assert.equal(durablePosts,0);
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('real customer mutation still cannot be classified as demo ACK',async()=>{
 let state={portal:{profile:{employees:12}}},posts=0;
 const client={
  isDemo:()=>false,currentUser:()=>({id:'tenant-A'}),authHeaders:async()=>({authorization:'Bearer token'}),
  load:async()=>({mode:'authenticated',state:structuredClone(state)}),
  write:async value=>({mode:'authenticated',state:state=structuredClone(value)})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{posts++;return {stored:false};}});
 await domain.init();
 domain.set('portal.profile.employees',20);
 assert.equal(domain.pendingHandoffs().pending,true);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 assert.equal(posts,1);
 assert.equal(domain.pendingHandoffs().pending,true);
});
