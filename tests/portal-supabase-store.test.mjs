import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabasePortalProjectionStore } from '../netlify/functions/_portal-supabase-store.mjs';
import { PORTAL_LAYERS } from '../platform/read-models/portal-projection-layers.mjs';

const response=(body,status=200)=>({ok:status>=200&&status<300,status,async json(){return body}});

function fakeClient(handler){
  const calls=[];
  const fetchFn=async(url,options={})=>{
    calls.push({url,options});
    const body=options.body?JSON.parse(options.body):{};
    return handler(body,options,url);
  };
  return {fetchFn,calls};
}

test('reads portal projection layers plus governance through the hardened Supabase Edge gateway',async()=>{
  const client=fakeClient(body=>{
    if(body.action==='governance')return response({governance:[{use_case_id:'agent-1',provider:'Anthropic',model_id:'global.anthropic.claude-sonnet-5',approved:true}]});
    if(body.action!=='get')return response({error:'unexpected'},500);
    if(body.layer===PORTAL_LAYERS.LEGACY)return response({payload:{sourceUpdatedAt:'2026-09-01T10:00:00.000Z',data:{company:{name:'Acme'},sourceMeta:{updatedAt:'2026-09-01T10:00:00.000Z'}}}});
    if(body.layer===PORTAL_LAYERS.CANONICAL)return response({payload:{sourceUpdatedAt:'2026-09-01T11:00:00.000Z',data:{company:{lastSync:'2026-09-01T11:00:00.000Z'},sourceMeta:{updatedAt:'2026-09-01T11:00:00.000Z'}}}});
    return response({error:'unexpected layer'},500);
  });
  const store=createSupabasePortalProjectionStore({fetchFn:client.fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'service'});
  const result=await store.get('tenant-1');
  assert.equal(result.tenantId,'tenant-1');
  assert.equal(result.origin,'composed');
  assert.equal(result.data.company.name,'Acme');
  assert.equal(result.data.company.lastSync,'2026-09-01T11:00:00.000Z');
  assert.equal(result.data.aiGovernance.length,1);
  assert.equal(result.data.aiGovernance[0].use_case_id,'agent-1');
  assert.equal(result.sourceUpdatedAt,'2026-09-01T11:00:00.000Z');
  assert.equal(client.calls.length,3);
  assert.ok(client.calls.every(call=>call.url==='https://example.supabase.co/functions/v1/portal-state-eu'));
  assert.ok(client.calls.every(call=>call.options.headers['x-bg-service-token']==='service'));
  assert.ok(client.calls.every(call=>!('apikey' in call.options.headers)));
});

test('writes only through the authenticated Edge gateway and preserves stale-write semantics',async()=>{
  const client=fakeClient(body=>response({stored:true,stale:false,record:body.payload}));
  const store=createSupabasePortalProjectionStore({fetchFn:client.fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'service'});
  const next={sourceUpdatedAt:'2026-09-01T12:00:00.000Z',data:{sourceMeta:{updatedAt:'2026-09-01T12:00:00.000Z'}}};
  const result=await store.putLegacy('tenant-1',next);
  assert.equal(result.stored,true);
  const body=JSON.parse(client.calls[0].options.body);
  assert.equal(body.action,'put');
  assert.equal(body.tenantId,'tenant-1');
  assert.equal(body.layer,PORTAL_LAYERS.LEGACY);
  assert.equal(body.payload.origin,PORTAL_LAYERS.LEGACY);
});

test('fails closed when EU store credentials are missing',()=>{
  assert.throws(()=>createSupabasePortalProjectionStore({baseUrl:'https://example.supabase.co',serviceToken:''}),/EU portal store configuration/i);
});
