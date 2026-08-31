import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrainRuntimeAdapter} from '../../brain/operating-loop/runtime-store.mjs';

test('production fails closed when canonical Supabase credentials are absent',()=>{
  assert.throws(
    ()=>createBrainRuntimeAdapter({env:{CONTEXT:'production'},blobAdapter:{get(){},put(){},list(){}}}),
    error=>error?.code==='BRAIN_CANONICAL_STORE_UNCONFIGURED'
  );
});

test('production never permits blob as canonical backend',()=>{
  assert.throws(
    ()=>createBrainRuntimeAdapter({env:{CONTEXT:'production',BRAIN_STORE_BACKEND:'blob'},blobAdapter:{get(){},put(){},list(){}}}),
    error=>error?.code==='BRAIN_NONCANONICAL_STORE_FORBIDDEN'
  );
});

test('explicit non-production blob backend remains available for deterministic local tests',()=>{
  const blobAdapter={get(){},put(){},list(){}};
  assert.equal(createBrainRuntimeAdapter({env:{CONTEXT:'dev',BRAIN_STORE_BACKEND:'blob'},blobAdapter}),blobAdapter);
});

test('Supabase backend uses RPC append and tenant-scoped ordered reads',async()=>{
  const calls=[];
  const fetchImpl=async(url,options={})=>{
    calls.push({url:String(url),options});
    if(String(url).includes('/rpc/brain_append_record')) return new Response(JSON.stringify([{tenant_id:'canonical',record_id:'r1',record_type:'Evidence',record_kind:'evidence',subject_id:'s1',correlation_id:null,predecessor_ids:[],owner_id:'owner',status:'VERIFIED',observed_at:'2026-08-31T00:00:00.000Z',executed:false,verified:true,result:null,evidence_ids:[],provenance:{},payload:{}}]),{status:200,headers:{'content-type':'application/json'}});
    return new Response(JSON.stringify([{tenant_id:'canonical',record_id:'r1',record_type:'Evidence',record_kind:'evidence',subject_id:'s1',correlation_id:null,predecessor_ids:[],owner_id:'owner',status:'VERIFIED',observed_at:'2026-08-31T00:00:00.000Z',executed:false,verified:true,result:null,evidence_ids:[],provenance:{},payload:{}}]),{status:200,headers:{'content-type':'application/json'}});
  };
  const adapter=createBrainRuntimeAdapter({env:{CONTEXT:'production',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'secret'},fetchImpl});
  const record={tenantId:'canonical',id:'r1',type:'Evidence',kind:'evidence',subjectId:'s1',correlationId:null,predecessorIds:[],owner:'owner',status:'VERIFIED',observedAt:'2026-08-31T00:00:00.000Z',executed:false,verified:true,result:null,evidenceIds:[],provenance:{},payload:{}};
  await adapter.appendRecord(record,{idempotencyKey:'k1',sourceRevision:'rev1'});
  const rows=await adapter.listRecords('canonical');
  assert.equal(rows.length,1);
  assert.equal(calls.length,2);
  assert.match(calls[0].url,/\/rest\/v1\/rpc\/brain_append_record$/);
  assert.equal(calls[0].options.headers.apikey,'secret');
  assert.equal(calls[0].options.headers.authorization,'Bearer secret');
  assert.match(calls[1].url,/brain_records\?select=\*&tenant_id=eq\.canonical&order=observed_at\.asc/);
});
