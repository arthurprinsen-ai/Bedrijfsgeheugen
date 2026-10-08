import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalDomainState} from '../portal-v2/domain-state.js';
import {PORTAL_IMPACT_ENGINE_VERSION} from '../portal-v2/portal-impact-engine.js';
const client=({demo,token,mode='authenticated'})=>({
 load:async()=>({mode,state:{}}),
 write:async state=>({mode,state}),
 authHeaders:async()=>token?{authorization:'Bearer fixture'}:{},
 isDemo:()=>demo
});
test('demo profile changes stay non-durable without loading or calling canonical BusinessInput storage',async()=>{
 let saves=0,loads=0;
 const domain=createPortalDomainState(client({demo:true}),{
  legacyStorage:null,
  businessInputStoreLoader:async()=>{loads++;throw new Error('durable store should not load')},
  businessInputSaver:async()=>{saves++;throw new Error('durable store should not save')}
 });
 domain.set('portal.profile.employees',12);
 await domain.flush();
 assert.equal(saves,0);
 assert.equal(loads,0);
});
test('non-demo without authorization fails closed rather than treating missing persistence as success',async()=>{
 const domain=createPortalDomainState(client({demo:false}),{legacyStorage:null});
 domain.set('portal.profile.employees',13);
 await assert.rejects(domain.flush(),/PORTAL_BUSINESS_INPUT_AUTH_REQUIRED/);
});
test('authenticated persisted BusinessInput must return canonical ACK even if portal state write succeeds',async()=>{
 const domain=createPortalDomainState(client({demo:false,token:true}),{
  legacyStorage:null,businessInputSaver:async()=>({stored:false})
 });
 domain.set('portal.profile.employees',14);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
});
test('the causal impact regression tracks the canonical One Brain contract rather than a retired version',()=>{
 assert.equal(PORTAL_IMPACT_ENGINE_VERSION,'2026-10-08-v4-one-brain-all-pages');
});
