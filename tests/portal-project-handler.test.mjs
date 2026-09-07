import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalProjectHandler} from '../platform/api/portal-project-handler.mjs';

test('weigert anonieme gebruiker',async()=>{
  const h=createPortalProjectHandler({getUser:async()=>null,store:{get:async()=>null}});
  assert.equal((await h(new Request('https://x/api/portal-project'))).status,401);
});

test('leest alleen identity tenant en negeert browser klantparameter',async()=>{
  let seen='';
  const h=createPortalProjectHandler({
    getUser:async()=>({id:'u1',appMetadata:{tenantId:'tenant-1'}}),
    store:{get:async id=>(seen=id,{customer:{name:'X'},quote:{nummer:'1'},runtime:null})}
  });
  assert.equal((await h(new Request('https://x/api/portal-project?klant=ijsselmonde'))).status,200);
  assert.equal(seen,'tenant-1');
});

test('weigert niet-GET requests',async()=>{
  const h=createPortalProjectHandler({getUser:async()=>({id:'u1'}),store:{get:async()=>null}});
  assert.equal((await h(new Request('https://x/api/portal-project',{method:'POST'}))).status,405);
});
