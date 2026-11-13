import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPortalBusinessInput,createPortalStateClient,portalAuthoringReadbackMatches} from '../portal-v2/portal-state.js';

const identity=()=>({currentUser:()=>({id:'one-tenant-user',jwt:async()=> 'signed-token'})});
const response=(body)=>({ok:true,status:200,json:async()=>body});
const sourceAck={stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'revision-1',brainRecordId:'brain-1',currentStateRecordId:'state-1',organismImpactRecordId:'impact-1'};

function clientFor(readback){
 return createPortalStateClient({identityProvider:identity,fetchImpl:async(url,options={})=>{
  if(url==='/api/portal-business-input')return response(sourceAck);
  if(url==='/api/portal-state'&&options.method==='POST')return response({stored:true,stale:false});
  if(url==='/api/portal-state'&&options.method==='GET')return response(readback);
  throw new Error('unexpected portal endpoint');
 }});
}

test('historical replay: original authored BusinessInput includes root values while derived models stay excluded',()=>{
 const submitted={portal:{profile:{employees:0}},companySettings:{closure:false,period:null,items:[]},signals:[{id:'computed'}]};
 const authored=buildPortalBusinessInput(submitted).answers;
 assert.deepEqual(authored,{portal:{profile:{employees:0}},companySettings:{closure:false,period:null,items:[]}});
 assert.equal(portalAuthoringReadbackMatches(authored,{portal:{profile:{employees:0}},companySettings:{closure:true,period:null,items:[]}}),false);
});

test('shadow: signed GET with stale top-level customer fact must refuse saved status even when portal subtree matches',async()=>{
 await assert.rejects(()=>clientFor({portal:{profile:{employees:0}},companySettings:{closure:true}})
  .write({portal:{profile:{employees:0}},companySettings:{closure:false}}),/PORTAL_STATE_VALUE_READBACK_MISMATCH/);
});

test('canary: exact root-level zero/null/false/array remains saved; changed read-only signals do not block',async()=>{
 const client=clientFor({portal:{profile:{employees:0}},companySettings:{closure:false,period:null,items:[]},signals:[{id:'new-projection'}]});
 const result=await client.write({
  portal:{profile:{employees:0}},companySettings:{closure:false,period:null,items:[]},
  signals:[{id:'old-derived'}]
 });
 assert.equal(result.mode,'authenticated');
 assert.equal(result.state.companySettings.closure,false);
 assert.deepEqual(result.state.companySettings.items,[]);
});
