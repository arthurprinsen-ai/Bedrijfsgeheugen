import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalStateClient} from '../portal-v2/portal-state.js';

const identityProvider=()=>({currentUser:()=>({id:'tenant-user-1',jwt:async()=> 'authorized-tenant-jwt'})});
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
const businessReceipt={stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,
 sourceRevision:'source-a',brainRecordId:'brain-a',currentStateRecordId:'state-a',organismImpactRecordId:'impact-a'};
const candidate={portal:{profile:{employees:24}}};

function clientWithProjection(projection,{readback=candidate,readbackStatus=200}={}){
 const calls=[];
 const client=createPortalStateClient({identityProvider,fetchImpl:async(url,options={})=>{
  calls.push({url,method:options.method||'GET'});
  if(url==='/api/portal-business-input')return response(businessReceipt);
  if(url==='/api/portal-state'&&options.method==='POST')return response(projection);
  if(url==='/api/portal-state'&&(!options.method||options.method==='GET'))return response(readback,readbackStatus);
  throw Error('UNEXPECTED_ROUTE');
 }});
 return {client,calls};
}
test('historical replay: no HTTP 2xx or stale-only acknowledgement can claim a persisted customer projection',async()=>{
 for(const ack of [{},{stored:true},{stored:false,stale:false},{stored:true,stale:true},{stored:'true',stale:false},{stored:true,stale:'false'}]){
  const {client,calls}=clientWithProjection(ack);
  await assert.rejects(()=>client.write(candidate),/PORTAL_STATE_ACK_INCOMPLETE|PORTAL_STATE_STALE_PROJECTION/);
  assert.deepEqual(calls.map(x=>x.method),['POST','POST'],'no server readback for an unacknowledged write');
 }
});
test('actual explicitly stored nonstale customer projection requires authenticated canonical GET',async()=>{
 const {client,calls}=clientWithProjection({stored:true,stale:false});
 const saved=await client.write(candidate);
 assert.equal(saved.mode,'authenticated');
 assert.equal(saved.state.portal.profile.employees,24);
 assert.deepEqual(calls.map(x=>x.method),['POST','POST','GET']);
});
test('tenant/readback unavailable after accepted write cannot claim success',async()=>{
 const {client,calls}=clientWithProjection({stored:true,stale:false},{readback:{error:'NOT_FOUND'},readbackStatus:404});
 await assert.rejects(()=>client.write(candidate),/PORTAL_STATE_READBACK_NOT_AUTHENTICATED/);
 assert.deepEqual(calls.map(x=>x.method),['POST','POST','GET']);
});
test('canonical BusinessInput failure still prevents any projection or GET readback',async()=>{
 const calls=[];
 const client=createPortalStateClient({identityProvider,fetchImpl:async(url)=>{
  calls.push(url);
  if(url==='/api/portal-business-input')return response({error:'CANONICAL_AUTHORITY_WRITE_FAILED'},502);
  throw Error('MUST_NOT_RUN');
 }});
 await assert.rejects(()=>client.write(candidate),/CANONICAL_AUTHORITY_WRITE_FAILED/);
 assert.deepEqual(calls,['/api/portal-business-input']);
});
