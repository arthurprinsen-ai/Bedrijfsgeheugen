import test from 'node:test';
import assert from 'node:assert/strict';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';
import {connectorConfigurationForImpact,isConnectorConfigurationChanged,pendingConnectorImpactReview} from '../platform/regulatory/connector-change-impact-gate.mjs';

const user={id:'owner-1',tenantId:'tenant-a'};
const req=(method,path,body)=>({method,path,body});
function createStore(){
 const entries=new Map();
 return {
  async get(tenant,id){return entries.get(tenant+':'+id)||null;},
  async list(tenant){return [...entries.values()].filter(e=>e.tenantId===tenant);},
  async saveDraft(tenant,input){const value={...input,id:input.id||'connector-1',tenantId:tenant};entries.set(tenant+':'+value.id,value);return value;},
  async listReviewQueue(){return[];}
 };
}
test('a browser cannot activate a connector in draft create, even with forged impact approval',async()=>{
 const store=createStore();
 const response=await handlePortalConnectorsRequest({
  user,store,request:req('POST','/api/connectors',{name:'Finance',source:{type:'email'},target:{type:'afas'},state:'Active',version:900,
    runtime:{changeImpact:{status:'APPROVED'},crossDomainApproval:{status:'APPROVED'},refreshMinutes:60}})
 });
 assert.equal(response.status,201);
 const connector=await response.json();
 assert.equal(connector.state,'Draft');assert.equal(connector.version,1);
 assert.equal(connector.runtime.changeImpact.status,'REVIEW_REQUIRED');
 assert.equal(connector.runtime.crossDomainApproval,undefined);
 assert.equal(connector.runtime.changeImpact.esrsReview.some(x=>x.standard==='ESRS_E1'),true);
 const queued=await handlePortalConnectorsRequest({user,store,request:req('GET','/api/connectors/review-queue')});
 assert.equal(queued.status,200);
 const rows=await queued.json();
 assert.equal(rows.length,1);
 assert.equal(rows[0].reviewKind,'CROSS_DOMAIN_CHANGE');
 assert.ok(rows[0].affectedDomains.includes('csrd_esrs_scope'));
 assert.equal(JSON.stringify(rows).includes('password'),false);
});
test('activation fails before reaching the connector or sovereignty external gateways while impact review remains open',async()=>{
 const store=createStore();
 await handlePortalConnectorsRequest({user,store,request:req('POST','/api/connectors',{name:'Finance',source:{type:'email'},target:{type:'afas'}})});
 let called=0;
 const response=await handlePortalConnectorsRequest({user,store,request:req('POST','/api/connectors/connector-1/activate',{testExecutionId:'fake',approved:true}),engine:{activationEligibility(){called++;return {eligible:true};}},sovereignty:{assertConnectorAllowed(){called++;}}});
 assert.equal(response.status,409);
 const body=await response.json();assert.equal(body.error,'CROSS_DOMAIN_REVIEW_REQUIRED');
 assert.equal(called,0);
});
test('material edits invalidate the prior connector version; a no-op edit retains the pending review',async()=>{
 const store=createStore();
 const body={id:'connector-1',name:'Finance',source:{type:'email'},target:{type:'afas'}};
 await handlePortalConnectorsRequest({user,store,request:req('POST','/api/connectors',body)});
 const before=await store.get('tenant-a','connector-1');
 const edit=await handlePortalConnectorsRequest({user,store,request:req('PUT','/api/connectors/connector-1/draft',{...body,target:{type:'exact'},state:'Active'})});
 assert.equal(edit.status,200);
 const changed=await edit.json();
 assert.equal(changed.version,2);assert.equal(changed.state,'Draft');
 assert.equal(changed.runtime.changeImpact.changed,true);
 const fixed=await handlePortalConnectorsRequest({user,store,request:req('PUT','/api/connectors/connector-1/draft',{...body,target:{type:'exact'},state:'Active',runtime:{crossDomainApproval:{status:'APPROVED'},changeImpact:{status:'APPROVED'}}})});
 assert.equal(fixed.status,200);
 const unchanged=await fixed.json();
 assert.equal(unchanged.version,2);
 assert.equal(unchanged.runtime.changeImpact.changeId,changed.runtime.changeImpact.changeId);
 assert.equal(unchanged.runtime.crossDomainApproval,undefined);
 assert.equal(unchanged.state,'Draft');
 assert.equal(isConnectorConfigurationChanged(before,unchanged),true);
});
test('administrative and test evidence changes do not falsely trigger a new dataflow impact',()=>{
 const a={id:'x',name:'Finance',source:{type:'api'},target:{type:'afas'},state:'Draft',version:1,runtime:{refreshMinutes:60}};
 const b={...a,version:10,state:'Paused',runtime:{...a.runtime,changeImpact:{status:'REVIEW_REQUIRED'},activationEvidence:{status:'VERIFIED'}}};
 assert.equal(isConnectorConfigurationChanged(a,b),false);
 assert.deepEqual(connectorConfigurationForImpact(a),connectorConfigurationForImpact(b));
 assert.equal(pendingConnectorImpactReview(b),null);
});
