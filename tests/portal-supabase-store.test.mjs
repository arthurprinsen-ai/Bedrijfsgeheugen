import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabasePortalProjectionStore } from '../netlify/functions/_portal-supabase-store.mjs';
import { PORTAL_LAYERS } from '../platform/read-models/portal-projection-layers.mjs';

const response=(body,status=200)=>({ok:status>=200&&status<300,status,async json(){return body}});

function fakeClient(routes){
  const calls=[];
  const fetchFn=async(url,options={})=>{
    calls.push({url,options});
    const body=options.body?JSON.parse(options.body):{};
    const key=`${url.split('/').at(-1)}:${body.p_layer||''}`;
    const handler=routes[key]||routes[url.split('/').at(-1)];
    if(!handler)return response({message:`unexpected ${key}`},500);
    return handler(body,options);
  };
  return {fetchFn,calls};
}

test('reads portal projection layers from the Supabase EU RPC surface and composes them',async()=>{
  const client=fakeClient({
    [`bg_portal_state_get:${PORTAL_LAYERS.LEGACY}`]:()=>response([{payload:{sourceUpdatedAt:'2026-09-01T10:00:00.000Z',data:{company:{name:'Acme'},sourceMeta:{updatedAt:'2026-09-01T10:00:00.000Z'}}}}]),
    [`bg_portal_state_get:${PORTAL_LAYERS.CANONICAL}`]:()=>response([{payload:{sourceUpdatedAt:'2026-09-01T11:00:00.000Z',data:{company:{lastSync:'2026-09-01T11:00:00.000Z'},sourceMeta:{updatedAt:'2026-09-01T11:00:00.000Z'}}}}])
  });
  const store=createSupabasePortalProjectionStore({fetchFn:client.fetchFn,baseUrl:'https://example.supabase.co',anonKey:'anon',serviceToken:'service'});
  const result=await store.get('tenant-1');
  assert.equal(result.tenantId,'tenant-1');
  assert.equal(result.origin,'composed');
  assert.equal(result.data.company.name,'Acme');
  assert.equal(result.data.company.lastSync,'2026-09-01T11:00:00.000Z');
  assert.equal(result.sourceUpdatedAt,'2026-09-01T11:00:00.000Z');
  assert.equal(client.calls.length,2);
  assert.ok(client.calls.every(call=>call.options.headers.apikey==='anon'));
});

test('writes only through the authenticated Supabase RPC and preserves stale-write semantics',async()=>{
  const client=fakeClient({
    [`bg_portal_state_put:${PORTAL_LAYERS.LEGACY}`]:body=>response([{stored:true,stale:false,record:body.p_payload}])
  });
  const store=createSupabasePortalProjectionStore({fetchFn:client.fetchFn,baseUrl:'https://example.supabase.co',anonKey:'anon',serviceToken:'service'});
  const next={sourceUpdatedAt:'2026-09-01T12:00:00.000Z',data:{sourceMeta:{updatedAt:'2026-09-01T12:00:00.000Z'}}};
  const result=await store.putLegacy('tenant-1',next);
  assert.equal(result.stored,true);
  const body=JSON.parse(client.calls[0].options.body);
  assert.equal(body.p_tenant_id,'tenant-1');
  assert.equal(body.p_layer,PORTAL_LAYERS.LEGACY);
  assert.equal(body.p_service_token,'service');
  assert.equal(body.p_payload.origin,PORTAL_LAYERS.LEGACY);
});

test('fails closed when EU store credentials are missing',()=>{
  assert.throws(()=>createSupabasePortalProjectionStore({baseUrl:'https://example.supabase.co',anonKey:'',serviceToken:''}),/EU portal store configuration/i);
});
