import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalDomainState} from '../portal-v2/domain-state.js';
import {PORTAL_IMPACT_ENGINE_VERSION} from '../portal-v2/portal-impact-engine.js';

test('demo mutation flush is non-durable; business-input provider is not invoked',async()=>{
 let count=0;
 const client={load:async()=>({mode:'authenticated',state:{}}),write:async state=>({mode:'authenticated',state}),authHeaders:async()=>({}),isDemo:()=>true};
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{count++;return {stored:true};}});
 await domain.init();
 domain.set('portal.profile.employees',16);
 await domain.flush();
 assert.equal(count,0);
 assert.equal(domain.initialized(),true);
});
test('authenticated missing authorization is rejected and does not report durable success',async()=>{
 let writes=0;
 const client={load:async()=>({mode:'authenticated',state:{}}),write:async state=>({mode:'authenticated',state}),authHeaders:async()=>({}),isDemo:()=>false};
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{writes++;return {stored:true};}});
 domain.set('portal.profile.employees',16);
 await assert.rejects(()=>domain.flush(),/PORTAL_BUSINESS_INPUT_AUTH_REQUIRED/);
 assert.equal(writes,0);
});
test('authenticated provider must confirm durable storage even with a valid token',async()=>{
 const client={load:async()=>({mode:'authenticated',state:{}}),write:async state=>({mode:'authenticated',state}),authHeaders:async()=>({authorization:'Bearer test'}),isDemo:()=>false};
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>({stored:false,skipped:true,reason:'DEMO_NON_DURABLE'})});
 domain.set('portal.profile.employees',16);
 await assert.rejects(()=>domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
});
test('portal propagation contract references the current One Brain v4 version',()=>assert.equal(PORTAL_IMPACT_ENGINE_VERSION,'2026-10-08-v4-one-brain-all-pages'));
