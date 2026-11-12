import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalStateClient} from '../portal-v2/portal-state.js';
import {mergeProjectState} from '../portal-v2/project-state.js';

const original={portal:{profile:{employees:13},metrics:{revenue:0},
 tasks:{items:[{id:'local-task'}]},roadmap:{items:[{id:'r1'}]},documents:{items:[{id:'d1'}]},
 integrations:{items:[{id:'i1'}]},notes:{items:[{id:'n1'}]},activity:[{id:'a1'}]}};

test('historical external project read does not erase missing source collections or explicit zero',()=>{
 const actual=mergeProjectState(original,{customer:{name:'Company'},quote:{title:'Official quote',inhoud:{summary:'Source only'}}});
 for(const k of ['tasks','roadmap','documents','integrations','notes','activity'])assert.deepEqual(actual.portal[k],original.portal[k]);
 assert.equal(actual.portal.metrics.revenue,0);
});
test('shadow tenant-scoped POST 200 without durable portal ACK never reads or reports saved',async()=>{
 const seen=[];
 const user={id:'u',jwt:async()=> 'tenant-a-token'};
 const fetchImpl=async(url,options={})=>{
  seen.push(url);
  if(url==='/api/portal-business-input')return {ok:true,status:200,json:async()=>({stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'rev-a',brainRecordId:'brain-a',currentStateRecordId:'state-a',organismImpactRecordId:'impact-a'})};
  if(url==='/api/portal-state'&&options.method==='POST')return {ok:true,status:200,json:async()=>({stored:false,stale:true})};
  throw new Error('No read after stale acknowledgment');
 };
 const client=createPortalStateClient({identityProvider:()=>({currentUser:()=>user}),fetchImpl});
 await assert.rejects(()=>client.write(original),/PORTAL_STATE_WRITE_ACK_INCOMPLETE/);
 assert.deepEqual(seen,['/api/portal-business-input','/api/portal-state']);
});
test('canary POST stored=true but old authoritative portal state remains unverified',async()=>{
 const user={id:'u',jwt:async()=> 'tenant-a-token'};
 const fetchImpl=async(url,options={})=>{
  if(url==='/api/portal-business-input')return {ok:true,status:200,json:async()=>({stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'rev-a',brainRecordId:'brain-a',currentStateRecordId:'state-a',organismImpactRecordId:'impact-a'})};
  if(url==='/api/portal-state'&&options.method==='POST')return {ok:true,status:200,json:async()=>({stored:true,stale:false})};
  return {ok:true,status:200,json:async()=>({portal:{...original.portal,profile:{employees:12}}})};
 };
 await assert.rejects(()=>createPortalStateClient({identityProvider:()=>({currentUser:()=>user}),fetchImpl}).write(original),/PORTAL_STATE_READBACK_MISMATCH/);
});
