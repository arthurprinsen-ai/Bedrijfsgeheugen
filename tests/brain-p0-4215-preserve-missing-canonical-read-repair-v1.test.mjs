import test from 'node:test';
import assert from 'node:assert/strict';
import {mergePreservedBusinessInputAnswers} from '../supabase/functions/_shared/portal-business-input-answer-merge.js';
import {projectCanonicalObject} from '../platform/read-models/portal-projection-layers.mjs';
import {repairBusinessInputsFromAuthority} from '../supabase/functions/portal-state-eu/business-input-read-repair.js';

const tenant='tenant-finance';
const object=(answers,ts,metadata={preserveMissing:true},id='PORTAL_INPUT-FinancialAssessment-value-financing-primary')=>({
 id,tenantId:tenant,type:'BusinessInput',truthClass:'SourceTruth',ownerId:'actor-A',
 data:{inputType:'FinancialAssessment',modelId:'value-financing',instanceId:'primary',schemaVersion:1,answers,metadata,sourcePortal:'portal-v2',submittedBy:'actor-A',submittedAt:ts},
 createdAt:ts,updatedAt:ts,provenance:{sourceType:'PortalInput'}
});
const record=(answers,ts,id='PORTAL_INPUT-FinancialAssessment-value-financing-primary',metadata={preserveMissing:true})=>({
 tenant_id:tenant,record_type:'BusinessInput',record_kind:'SourceTruth',
 record_id:'BRAIN-'+ts,subject_id:id,owner_id:'actor-A',observed_at:ts,updated_at:ts,source_revision:'rev-'+ts,
 provenance:{sourceType:'PortalInput'},payload:{canonicalObjectId:id,inputType:'FinancialAssessment',modelId:'value-financing',instanceId:'primary',schemaVersion:1,answers,metadata,sourcePortal:'portal-v2',submittedAt:ts,truthClass:'SourceTruth'}
});
const t1='2026-10-09T09:00:00Z',t2='2026-10-09T09:01:00Z',t3='2026-10-09T09:02:00Z';
const full={finance:{ebitda:120000,dso:35,debt:50000},people:{mto:{score:64,responses:31}},ai:{governance:{humanOversight:true,vendor:'NL'}}};
const partial={finance:{ebitda:125000},people:{mto:{score:67}},ai:{governance:{humanOversight:false}}};

test('nested partial BusinessInput edits preserve unmentioned finance, people and AI governance fields',()=>{
 const before=projectCanonicalObject({},object(full,t1));
 const after=projectCanonicalObject(before,object(partial,t2));
 assert.equal(after.businessInputs.length,1);
 assert.deepEqual(after.businessInputs[0].answers,{
  finance:{ebitda:125000,dso:35,debt:50000},
  people:{mto:{score:67,responses:31}},
  ai:{governance:{humanOversight:false,vendor:'NL'}}
 });
 assert.equal(after.businessInputs[0].updatedAt,t2);
});

test('explicit null/false/zero, empty text and arrays replace prior values while missing fields survive',()=>{
 const left={personnel:{capacity:4,active:true,note:'Filled',risks:['a','b']},x:{present:1},legacy:4};
 const right={personnel:{capacity:0,active:false,note:'',risks:[]},x:null};
 assert.deepEqual(mergePreservedBusinessInputAnswers(left,right),{personnel:{capacity:0,active:false,note:'',risks:[]},x:null,legacy:4});
});

test('without preserveMissing an authoritative full update intentionally replaces obsolete fields',()=>{
 const first=projectCanonicalObject({},object({finance:{ebitda:100,dso:40}},t1));
 const second=projectCanonicalObject(first,object({finance:{ebitda:150}},t2,{}));
 assert.deepEqual(second.businessInputs[0].answers,{finance:{ebitda:150}});
});

test('read-repair replays older + newer partial Brain records without orphaning existing customer fields',()=>{
 const current={businessInputs:[],sourceMeta:{updatedAt:t1}};
 const repaired=repairBusinessInputsFromAuthority(current,[record(partial,t2),record(full,t1)]);
 assert.equal(repaired.businessInputs.length,1);
 assert.deepEqual(repaired.businessInputs[0].answers,{
  finance:{ebitda:125000,dso:35,debt:50000},
  people:{mto:{score:67,responses:31}},
  ai:{governance:{humanOversight:false,vendor:'NL'}}
 });
 assert.equal(repaired.businessInputs[0].metadata.sourceRevision,'rev-'+t2);
});

test('read-repair ignores stale partial Brain snapshots that predate the existing confirmed projection',()=>{
 const latest=projectCanonicalObject({},object(full,t3));
 const repaired=repairBusinessInputsFromAuthority(latest,[record(partial,t2)]);
 assert.deepEqual(repaired.businessInputs[0].answers,full);
 assert.equal(repaired.businessInputs[0].updatedAt,t3);
});

test('read-repair without preserveMissing respects full replacement just like the projector',()=>{
 const repaired=repairBusinessInputsFromAuthority({},[record(full,t1),record({finance:{ebitda:140000}},t2,undefined,{})]);
 assert.deepEqual(repaired.businessInputs[0].answers,{finance:{ebitda:140000}});
});

test('merge is safe for user-submitted __proto__ and constructor field names',()=>{
 const a=JSON.parse('{"safe":{"v":1},"__proto__":{"x":"value"}}');
 const b=JSON.parse('{"constructor":{"prototype":{"polluted":true}},"safe":{"v":2}}');
 const out=mergePreservedBusinessInputAnswers(a,b);
 assert.equal(Object.prototype.hasOwnProperty.call(out,'__proto__'),true);
 assert.equal(out.safe.v,2);
 assert.equal({}.polluted,undefined);
 assert.equal(Object.getPrototypeOf(out),Object.prototype);
});
