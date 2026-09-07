import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPortalProject} from '../portal-next/portal-project-store.js';

const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});

test('ready normaliseert geautoriseerde projectdata',async()=>{
  const result=await loadPortalProject({fetchFn:async()=>response(200,{customer:{name:'IJsselmonde'},quote:{nummer:'OF-1',inhoud:{onderdelen:[]}},runtime:null})});
  assert.equal(result.state,'ready');
  assert.equal(result.project.quote.number,'OF-1');
  assert.equal(result.error,null);
});

test('404 geeft neutrale empty state zonder demo data',async()=>{
  const result=await loadPortalProject({fetchFn:async()=>response(404,{error:'NOT_FOUND'})});
  assert.deepEqual(result,{state:'empty',project:null,error:null});
});

test('401 geeft unauthorized',async()=>{
  const result=await loadPortalProject({fetchFn:async()=>response(401,{error:'UNAUTHORIZED'})});
  assert.equal(result.state,'unauthorized');
  assert.equal(result.project,null);
});

test('TENANT_NOT_CONFIGURED blijft zichtbaar als configuratieblocker en niet als lege klantdata',async()=>{
  const result=await loadPortalProject({fetchFn:async()=>response(403,{error:'TENANT_NOT_CONFIGURED'})});
  assert.deepEqual(result,{state:'tenant-unconfigured',project:null,error:'TENANT_NOT_CONFIGURED'});
});

test('netwerkfout blijft fail-closed',async()=>{
  const result=await loadPortalProject({fetchFn:async()=>{throw new Error('offline')}});
  assert.equal(result.state,'error');
  assert.equal(result.project,null);
  assert.match(result.error,/offline/);
});
