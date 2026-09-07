import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalProjectHandler} from '../platform/api/portal-project-handler.mjs';

const TENANT_ID='11111111-1111-4111-8111-111111111111';

test('weigert anonieme gebruiker',async()=>{
  const h=createPortalProjectHandler({getUser:async()=>null,store:{get:async()=>null}});
  assert.equal((await h(new Request('https://x/api/portal-project'))).status,401);
});

test('leest alleen identity tenant en negeert browser klantparameter',async()=>{
  let seen='';
  const h=createPortalProjectHandler({
    getUser:async()=>({id:'u1',appMetadata:{tenantId:TENANT_ID}}),
    store:{get:async id=>(seen=id,{customer:{name:'X'},quote:{nummer:'1'},runtime:null})}
  });
  assert.equal((await h(new Request('https://x/api/portal-project?klant=ijsselmonde'))).status,200);
  assert.equal(seen,TENANT_ID);
});

test('faalt expliciet wanneer identity geen project-tenant heeft in plaats van lege klantdata te suggereren',async()=>{
  let storeCalled=false;
  const h=createPortalProjectHandler({
    getUser:async()=>({id:'u1'}),
    store:{get:async()=>{storeCalled=true;return null}}
  });
  const response=await h(new Request('https://x/api/portal-project?klant=ijsselmonde'));
  assert.equal(response.status,403);
  assert.deepEqual(await response.json(),{error:'TENANT_NOT_CONFIGURED'});
  assert.equal(storeCalled,false);
});

test('faalt expliciet wanneer configured tenantId niet het UUID-contract van de projectstore volgt',async()=>{
  let storeCalled=false;
  const h=createPortalProjectHandler({
    getUser:async()=>({id:'u1',appMetadata:{tenantId:'tenant-1'}}),
    store:{get:async()=>{storeCalled=true;return null}}
  });
  const response=await h(new Request('https://x/api/portal-project'));
  assert.equal(response.status,403);
  assert.deepEqual(await response.json(),{error:'TENANT_NOT_CONFIGURED'});
  assert.equal(storeCalled,false);
});

test('weigert niet-GET requests',async()=>{
  const h=createPortalProjectHandler({getUser:async()=>({id:'u1'}),store:{get:async()=>null}});
  assert.equal((await h(new Request('https://x/api/portal-project',{method:'POST'}))).status,405);
});
