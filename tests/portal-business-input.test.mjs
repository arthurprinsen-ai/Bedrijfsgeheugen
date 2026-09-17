import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalBusinessInput } from '../platform/contracts/portal-business-input.mjs';
import { projectCanonicalObject } from '../platform/read-models/portal-projection-layers.mjs';
import { createPortalBusinessInputHandler } from '../platform/api/portal-business-input-handler.mjs';
import { readLegacyPortalBusinessInputs } from '../portal-next/portal-business-input-store.js';
import { repairBusinessInputsFromAuthority } from '../supabase/functions/portal-state-eu/business-input-read-repair.js';
import { createPortalDomainState } from '../portal-v2/domain-state.js';

test('portal business input is stored as SourceTruth with model lineage and raw answers', () => {
  const object=createPortalBusinessInput({tenantId:'tenant-1',userId:'user-1',inputType:'AIActAssessment',modelId:'eu-ai-act',instanceId:'primary',schemaVersion:3,answers:{usesAI:true,humanOversight:false},sourcePortal:'portal-next',submittedAt:'2026-09-17T15:40:00.000Z'});
  assert.equal(object.type,'BusinessInput');assert.equal(object.truthClass,'SourceTruth');assert.equal(object.tenantId,'tenant-1');assert.equal(object.provenance.sourceType,'PortalInput');assert.equal(object.data.inputType,'AIActAssessment');assert.equal(object.data.modelId,'eu-ai-act');assert.deepEqual(object.data.answers,{usesAI:true,humanOversight:false});
});

test('business input projection is first-class context and not only audit', () => {
  const object=createPortalBusinessInput({tenantId:'tenant-1',userId:'user-1',inputType:'StrategyCanvas',modelId:'strategy-dna',instanceId:'primary',schemaVersion:1,answers:{ambition:'Grow'},sourcePortal:'portal-next',submittedAt:'2026-09-17T15:40:00.000Z'});
  const state=projectCanonicalObject({},object);
  assert.equal(state.businessInputs.length,1);assert.equal(state.businessInputs[0].id,object.id);assert.equal(state.businessInputs[0].modelId,'strategy-dna');assert.deepEqual(state.businessInputs[0].answers,{ambition:'Grow'});assert.equal(state.audit?.length||0,0);
});

test('a later save of the same model instance replaces the projected input instead of duplicating it', () => {
  const first=createPortalBusinessInput({tenantId:'tenant-1',userId:'user-1',inputType:'Assessment',modelId:'capability',instanceId:'main',schemaVersion:1,answers:{score:2},sourcePortal:'legacy',submittedAt:'2026-09-17T15:40:00.000Z'});
  const second=createPortalBusinessInput({tenantId:'tenant-1',userId:'user-1',inputType:'Assessment',modelId:'capability',instanceId:'main',schemaVersion:1,answers:{score:4},sourcePortal:'portal-next',submittedAt:'2026-09-17T15:45:00.000Z'});
  const state=projectCanonicalObject(projectCanonicalObject({},first),second);
  assert.equal(first.id,second.id);assert.equal(state.businessInputs.length,1);assert.deepEqual(state.businessInputs[0].answers,{score:4});
});

test('authenticated ingest writes immutable Brain authority first, derives tenant from identity and persists canonical projection', async () => {
  let stored=null;let authorityWrite=null;
  const store={async getLayer(){return null;},async putCanonical(tenantId,record){stored={tenantId,record};return{stored:true,stale:false,record};}};
  const authority={async append(input){authorityWrite=input;return{authority:'supabase:brain_records',record:input.record};}};
  const handler=createPortalBusinessInputHandler({getUser:async()=>({id:'user-1',app_metadata:{tenantId:'tenant-real'}}),store,authority,now:()=> '2026-09-17T15:50:00.000Z'});
  const request=new Request('https://example.test/api/portal-business-input',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer test'},body:JSON.stringify({tenantId:'tenant-forged',inputType:'StrategyModel',modelId:'business-model',answers:{customer:'SME'},sourcePortal:'portal-next'})});
  const response=await handler(request);const payload=await response.json();
  assert.equal(response.status,200);assert.equal(authorityWrite.record.tenantId,'tenant-real');assert.equal(authorityWrite.record.type,'BusinessInput');assert.equal(authorityWrite.record.kind,'SourceTruth');assert.equal(authorityWrite.record.subjectId,'PORTAL_INPUT-StrategyModel-business-model-primary');assert.equal(stored.tenantId,'tenant-real');assert.equal(stored.record.origin,'canonical-brain');assert.equal(stored.record.data.businessInputs[0].truthClass,'SourceTruth');assert.equal(stored.record.data.businessInputs[0].answers.customer,'SME');assert.equal(stored.record.data.businessInputs[0].metadata.brainRecordId,payload.brainRecordId);assert.equal(payload.authorityStored,true);assert.equal(payload.stored,true);
});

test('identical portal content gets the same authority revision id for idempotent retry', async () => {
  const ids=[];const store={async getLayer(){return null;},async putCanonical(_tenantId,record){return{stored:true,record};}};const authority={async append({record}){ids.push(record.id);return{authority:'supabase:brain_records',record};}};
  const handler=createPortalBusinessInputHandler({getUser:async()=>({id:'user-1',app_metadata:{tenantId:'tenant-1'}}),store,authority,now:()=>new Date().toISOString()});
  const body={inputType:'AIActAssessment',modelId:'eu-ai-act',answers:{risk:'limited'},sourcePortal:'portal-next'};
  for(const authorization of ['Bearer a','Bearer b'])await handler(new Request('https://example.test/api/portal-business-input',{method:'POST',headers:{'content-type':'application/json',authorization},body:JSON.stringify(body)}));
  assert.equal(ids.length,2);assert.equal(ids[0],ids[1]);
});

test('canonical read-repair reconstructs a missing BusinessInput projection from Brain authority and keeps the newest revision', () => {
  const current={businessInputs:[{id:'PORTAL_INPUT-StrategyModel-business-model-primary',modelId:'business-model',instanceId:'primary',answers:{customer:'Old'},updatedAt:'2026-09-17T15:00:00.000Z'}],sourceMeta:{updatedAt:'2026-09-17T15:00:00.000Z'}};
  const records=[
    {record_id:'PORTAL_INPUT_RECORD-old',record_type:'BusinessInput',record_kind:'SourceTruth',subject_id:'PORTAL_INPUT-StrategyModel-business-model-primary',owner_id:'user-1',observed_at:'2026-09-17T15:10:00.000Z',updated_at:'2026-09-17T15:10:00.000Z',source_revision:'old',provenance:{sourceType:'PortalInput'},payload:{canonicalObjectId:'PORTAL_INPUT-StrategyModel-business-model-primary',inputType:'StrategyModel',modelId:'business-model',instanceId:'primary',answers:{customer:'SME'},sourcePortal:'portal-next',submittedAt:'2026-09-17T15:10:00.000Z',truthClass:'SourceTruth'}},
    {record_id:'PORTAL_INPUT_RECORD-new',record_type:'BusinessInput',record_kind:'SourceTruth',subject_id:'PORTAL_INPUT-StrategyModel-business-model-primary',owner_id:'user-1',observed_at:'2026-09-17T15:20:00.000Z',updated_at:'2026-09-17T15:20:00.000Z',source_revision:'new',provenance:{sourceType:'PortalInput'},payload:{canonicalObjectId:'PORTAL_INPUT-StrategyModel-business-model-primary',inputType:'StrategyModel',modelId:'business-model',instanceId:'primary',answers:{customer:'MKB'},sourcePortal:'portal-next',submittedAt:'2026-09-17T15:20:00.000Z',truthClass:'SourceTruth'}}
  ];
  const repaired=repairBusinessInputsFromAuthority(current,records);
  assert.equal(repaired.businessInputs.length,1);
  assert.deepEqual(repaired.businessInputs[0].answers,{customer:'MKB'});
  assert.equal(repaired.businessInputs[0].metadata.brainRecordId,'PORTAL_INPUT_RECORD-new');
  assert.equal(repaired.sourceMeta.kind,'canonical-brain');
  assert.equal(repaired.sourceMeta.updatedAt,'2026-09-17T15:20:00.000Z');
});

test('legacy portal browser states become migratable BusinessInputs without lead/auth keys', () => {
  const values=new Map([['bg_portaal_acme',JSON.stringify({beleid:{aibeleid:2},niveaus:{strategie:4}})],['bg_portaal_open','1'],['bg_portaal_lead',JSON.stringify({mail:'x@example.test'})]]);const storage={length:values.size,key:index=>[...values.keys()][index],getItem:key=>values.get(key)??null};const inputs=readLegacyPortalBusinessInputs(storage);
  assert.equal(inputs.length,1);assert.equal(inputs[0].modelId,'bg_portaal_acme');assert.equal(inputs[0].inputType,'LegacyPortalState');assert.deepEqual(inputs[0].answers.beleid,{aibeleid:2});
});

test('portal domain state sends authenticated BusinessInput through one canonical writer seam', async () => {
  const writes=[];
  const stateClient={load:async()=>({state:{}}),write:async state=>({mode:'authenticated',state}),authHeaders:async()=>({authorization:'Bearer live'}),isDemo:()=>false};
  const businessInputSaver=async(input,options)=>{writes.push({input,options});return{stored:true,objectId:'PORTAL_INPUT-StrategyModel-business-model-primary'};};
  const domain=createPortalDomainState(stateClient,{businessInputSaver});
  const result=await domain.saveBusinessInput({inputType:'StrategyModel',modelId:'business-model',answers:{customer:'MKB'},sourcePortal:'portal-v2'});
  assert.equal(result.stored,true);
  assert.equal(writes.length,1);
  assert.equal(writes[0].options.authorization,'Bearer live');
  assert.deepEqual(writes[0].input.answers,{customer:'MKB'});
});
