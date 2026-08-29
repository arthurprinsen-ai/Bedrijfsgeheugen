import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveIdentityTenant,sanitizePortalProjection,portalProjectionToState,shouldReplaceProjection} from '../platform/read-models/portal-server-state.mjs';
import {createPortalStateHandler} from '../platform/api/portal-state-handler.mjs';

test('tenant is server-derived from app metadata or identity id',()=>{
 assert.equal(resolveIdentityTenant({id:'u1',appMetadata:{tenantId:'acme'}}),'acme');
 assert.equal(resolveIdentityTenant({id:'u1',app_metadata:{tenantId:'legacy'}}),'legacy');
 assert.equal(resolveIdentityTenant({id:'u1'}),'user:u1');
 assert.equal(resolveIdentityTenant(null),null);
});

test('projection strips browser identity and tenant input',()=>{
 const p=sanitizePortalProjection({tenantId:'evil',user:{email:'x'},company:{name:'A'},sourceMeta:{updatedAt:'2026-08-29T19:00:00Z'}},{tenantId:'safe',userId:'u1',now:()=> '2026-08-29T20:00:00Z'});
 assert.equal(p.tenantId,'safe');assert.equal(p.data.user,undefined);assert.equal(p.data.tenantId,undefined);assert.equal(p.sourceUpdatedAt,'2026-08-29T19:00:00Z');
});

test('older browser projection cannot replace newer server projection',()=>{
 assert.equal(shouldReplaceProjection({sourceUpdatedAt:'2026-08-29T20:00:00Z'},{sourceUpdatedAt:'2026-08-29T19:00:00Z'}),false);
 assert.equal(shouldReplaceProjection({sourceUpdatedAt:'2026-08-29T19:00:00Z'},{sourceUpdatedAt:'2026-08-29T20:00:00Z'}),true);
});

test('handler denies unauthenticated requests and never accepts tenant from request',async()=>{
 const store={get:async()=>null,put:async()=>{throw new Error('must not write')}};
 const h=createPortalStateHandler({getUser:async()=>null,store});
 assert.equal((await h(new Request('https://x/api/portal-state'))).status,401);
});

test('handler reads only the derived tenant',async()=>{
 let readTenant='';const record=sanitizePortalProjection({company:{name:'A'}},{tenantId:'acme',userId:'u1'});
 const store={get:async t=>{readTenant=t;return record},put:async()=>({stored:true})};
 const h=createPortalStateHandler({getUser:async()=>({id:'u1',email:'a@x.nl',name:'A',appMetadata:{tenantId:'acme'}}),store});
 const r=await h(new Request('https://x/api/portal-state?tenant=other'));
 assert.equal(r.status,200);assert.equal(readTenant,'acme');assert.equal((await r.json()).company.name,'A');
});

test('handler writes only to derived tenant and rejects oversized state',async()=>{
 let writtenTenant='';const store={get:async()=>null,put:async(t,p)=>{writtenTenant=t;return {stored:true,record:p}}};
 const user={id:'u1',email:'a@x.nl',appMetadata:{tenantId:'acme'}};
 const h=createPortalStateHandler({getUser:async()=>user,store,maxBytes:1000});
 const r=await h(new Request('https://x/api/portal-state?tenant=other',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tenantId:'other',company:{name:'A'},sourceMeta:{updatedAt:'2026-08-29T20:00:00Z'}})}));
 assert.equal(r.status,200);assert.equal(writtenTenant,'acme');
 const tooBig=await h(new Request('https://x/api/portal-state',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({company:{blob:'x'.repeat(2000)}})}));
 assert.equal(tooBig.status,413);
});

test('stored projection rehydrates only current verified user identity',()=>{
 const p=sanitizePortalProjection({company:{name:'A'}},{tenantId:'acme',userId:'u1'});
 const s=portalProjectionToState(p,{id:'u2',email:'b@x.nl',name:'B',roles:['viewer']});
 assert.equal(s.user.email,'b@x.nl');assert.equal(s.company.name,'A');assert.equal(s.sourceMeta.kind,'server');
});
