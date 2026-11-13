import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPortalBusinessInputHandler} from '../platform/api/portal-business-input-handler.mjs';

const sql=readFileSync(new URL('../supabase/migrations/20261113060000_portal_brain_record_contract_parity_v1.sql',import.meta.url),'utf8');
const allowed=column=>{
 const re=new RegExp('check\\s*\\(\\s*'+column+'\\s+in\\s*\\(([\\s\\S]*?)\\)\\s*\\)\\s*not\\s+valid','i');
 const match=sql.match(re);
 assert.ok(match,'SQL must maintain exact allowlist for '+column);
 return new Set([...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]));
};
const types=allowed('record_type');
const kinds=allowed('record_kind');
const portalPairs=[
 ['SourceObservation','raw_source'],
 ['BusinessInput','SourceTruth'],
 ['CurrentState','current_state'],
 ['ImpactAssessment','organism_impact']
];

test('historical: original Brain producer types/kinds previously absent are explicitly supported, without deleting any original canonical labels',()=>{
 for(const [type,kind] of portalPairs){
  assert.ok(types.has(type),type+' missing from schema');
  assert.ok(kinds.has(kind),kind+' missing from schema');
 }
 for(const type of ['Evidence','Signal','Opportunity','Impact','Decision','Action','Execution','Verification','Outcome','Value','Learning','Memory','Entity','Relation','CurrentState','Governance'])assert.ok(types.has(type),type+' canonical type removed');
 for(const kind of ['evidence','signal','opportunity','impact','decision','action','execution','verification','outcome','value','learning','memory','entity','relation','current_state','governance'])assert.ok(kinds.has(kind),kind+' canonical kind removed');
 assert.match(sql,/validate constraint brain_records_type_check/i);
 assert.match(sql,/validate constraint brain_records_kind_check/i);
});

test('shadow: same original authenticated writer sends four accepted Brain types, with user-issued tenant and causal parentage',async()=>{
 const records=[];
 const handler=createPortalBusinessInputHandler({
  getUser:async()=>({id:'member-a',app_metadata:{tenantId:'tenant-a'}}),
  authority:{async append({record}){
   assert.ok(types.has(record.type),'unsupported record type: '+record.type);
   assert.ok(kinds.has(record.kind),'unsupported kind: '+record.kind);
   assert.equal(record.tenantId,'tenant-a');
   records.push(record);
   return {authority:'supabase:brain_records',record};
  }},
  store:{
   async getLayer(){return null;},
   async putCanonical(tenant,record){
    assert.equal(tenant,'tenant-a');
    return {stored:true,stale:false,record};
   }
  },
  now:()=> '2026-11-13T06:00:00.000Z'
 });
 const req=new Request('https://test.invalid/api/portal-business-input',{
  method:'POST',
  headers:{authorization:'Bearer synthetic', 'content-type':'application/json'},
  body:JSON.stringify({tenantId:'forged-other-tenant',inputType:'CompanyProfile',modelId:'company-profile',answers:{employees:0},sourcePortal:'portal-v2'})
 });
 const response=await handler(req);
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.stored,true);
 assert.equal(body.powerhouseFeedStored,true);
 assert.equal(body.organismImpactStored,true);
 assert.deepEqual(records.map(r=>[r.type,r.kind]),portalPairs);
 assert.equal(records[1].payload.answers.employees,0);
 assert.deepEqual(records[2].predecessorIds,[records[1].id]);
 assert.deepEqual(records[3].predecessorIds,[records[2].id]);
 assert.ok(records.every(r=>r.correlationId===records[1].correlationId));
});

test('canary: no new public RLS/ACL authority, no secondary writer, and old incompatible Brain admission fails closed',async()=>{
 assert.doesNotMatch(sql,/\b(?:disable\s+row\s+level\s+security|grant\s+|create\s+table\s+|create\s+function\s+|security\s+definer)\b/i);
 let projectionWrites=0;
 const handler=createPortalBusinessInputHandler({
  getUser:async()=>({id:'member-a',app_metadata:{tenantId:'tenant-a'}}),
  authority:{async append({record}){
   if(record.type==='SourceObservation')throw new Error('brain_records_type_check rejected SourceObservation');
   return {record};
  }},
  store:{async getLayer(){return null},async putCanonical(){projectionWrites++;return {stored:true}}},
  now:()=> '2026-11-13T06:00:00.000Z'
 });
 const response=await handler(new Request('https://test.invalid/api/portal-business-input',{
  method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},
  body:JSON.stringify({inputType:'CompanyProfile',modelId:'company-profile',answers:{employees:0},sourcePortal:'portal-v2'})
 }));
 assert.equal(response.status,502);
 assert.equal((await response.json()).error,'RAW_SOURCE_WRITE_FAILED');
 assert.equal(projectionWrites,0);
});
