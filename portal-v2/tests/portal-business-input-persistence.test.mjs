import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalStateClient, buildPortalBusinessInput } from '../portal-state.js';

const identity=()=>({currentUser:()=>({id:'user-1',jwt:async()=> 'jwt-token'})});
const response=(body={},status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});

test('buildPortalBusinessInput keeps portal knowledge and excludes derived read-model state',()=>{
  const input=buildPortalBusinessInput({
    portal:{profile:{employees:24},strategicModels:{bcg:{note:'Investeer gericht'}},compliance:{aiAct:{role:'provider'}}},
    businessInputs:[{id:'old'}],signals:[{id:'derived'}],recommendedActions:[{id:'derived-action'}],audit:[{id:'audit'}],sourceMeta:{live:true},dataAiRuntime:{status:'ok'}
  });
  assert.equal(input.inputType,'PortalDomainStateSnapshot');
  assert.equal(input.modelId,'portal-v2-domain-state');
  assert.equal(input.sourcePortal,'portal-v2');
  assert.deepEqual(input.answers,{portal:{profile:{employees:24},strategicModels:{bcg:{note:'Investeer gericht'}},compliance:{aiAct:{role:'provider'}}}});
});

test('authenticated write stores canonical business input before portal projection',async()=>{
  const calls=[];
  const client=createPortalStateClient({identityProvider:identity,fetchImpl:async(url,options={})=>{
    calls.push({url,options});
    if(url==='/api/portal-business-input')return response({stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'revision-1',brainRecordId:'brain-input-1',currentStateRecordId:'brain-state-1',organismImpactRecordId:'brain-impact-1'});
    if(url==='/api/portal-state'&&options.method==='POST')return response({stored:true});
    if(url==='/api/portal-state'&&options.method==='GET')return response({portal:{profile:{employees:24}}});
    throw new Error(`unexpected ${url}`);
  }});
  await client.write({portal:{profile:{employees:24}}});
  assert.deepEqual(calls.slice(0,2).map(call=>call.url),['/api/portal-business-input','/api/portal-state']);
  const canonical=JSON.parse(calls[0].options.body);
  assert.equal(canonical.answers.portal.profile.employees,24);
  assert.equal(calls[0].options.headers.authorization,'Bearer jwt-token');
});

test('canonical failure is fail-closed and prevents portal projection write',async()=>{
  const calls=[];
  const client=createPortalStateClient({identityProvider:identity,fetchImpl:async(url,options={})=>{
    calls.push({url,options});
    if(url==='/api/portal-business-input')return response({error:'CANONICAL_AUTHORITY_WRITE_FAILED'},502);
    throw new Error('portal projection must not be called');
  }});
  await assert.rejects(()=>client.write({portal:{profile:{employees:24}}}),/CANONICAL_AUTHORITY_WRITE_FAILED/);
  assert.deepEqual(calls.map(call=>call.url),['/api/portal-business-input']);
});


test('HTTP 200 without durable canonical and Brain acknowledgement never proceeds to portal projection',async()=>{
  const cases=[
    {stored:false,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'rev',brainRecordId:'input',currentStateRecordId:'state',organismImpactRecordId:'impact'},
    {stored:true,stale:true,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'rev',brainRecordId:'input',currentStateRecordId:'state',organismImpactRecordId:'impact'},
    {stored:true,stale:false,authorityStored:true,powerhouseFeedStored:false,organismImpactStored:true,sourceRevision:'rev',brainRecordId:'input',currentStateRecordId:'state',organismImpactRecordId:'impact'},
    {stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true}
  ];
  for(const acknowledgement of cases){
    const calls=[];
    const client=createPortalStateClient({identityProvider:identity,fetchImpl:async(url)=>{
      calls.push(url);
      if(url==='/api/portal-business-input')return response(acknowledgement);
      throw new Error('Projection must never run without canonical acknowledgement');
    }});
    await assert.rejects(()=>client.write({portal:{profile:{employees:24}}}),/PORTAL_BUSINESS_INPUT_ACK_INCOMPLETE/);
    assert.deepEqual(calls,['/api/portal-business-input']);
  }
});
