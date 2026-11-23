import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {connectorHealthReport} from '../platform/connectors/connector-operations-proof.mjs';
import {DEFAULT_TRANSFER_POLICY} from '../assets/js/koppelingen/transfer-policy.js';
import {buildCustomConnectorTemplate} from '../assets/js/koppelingen/provider-catalog.js';
import {createWizardState,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

const tenant='11111111-1111-4111-8111-111111111111';
const otherTenant='99999999-9999-4999-8999-999999999999';
const id='22222222-2222-4222-8222-222222222222';
const sourceHash='a'.repeat(64);
const now=new Date('2026-11-22T16:00:00Z');
const connector={
 id,tenantId:tenant,version:3,state:'Active',name:'AFAS Facturen',
 source:{type:'afas',environment:'12345',getConnector:'BG_Facturen'},
 target:{type:'datahub'},documentSchema:{type:'record',fields:['factuurnummer','Bedrag']},
 routing:{portalPages:['waarde-financiering'],selectedFields:['factuurnummer','Bedrag']},
 dataUse:{mode:'PORTAL_INSIGHTS',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'},
 transferPolicy:{...DEFAULT_TRANSFER_POLICY,trigger:'INTERVAL',intervalMinutes:60}
};
const sourceRows=[['F-001',0],['F-002',125]];
const snapshot={
 organisatie_id:tenant,connector_id:id,connector_versie:3,provider:'afas',bron_gecontroleerd:true,
 get_connector:'BG_Facturen',kolommen:['factuurnummer','Bedrag'],
 rijen:sourceRows,aantal:2,bron_hash:sourceHash,ingelezen_op:'2026-11-22T15:40:00Z'
};
const sourceExecution={
 id:'33333333-3333-4333-8333-333333333333',organisatie_id:tenant,connector_id:id,
 connector_versie:3,status:'SOURCE_SYNCED',
 afgerond_op:'2026-11-22T15:41:00Z',
 evidence:{provider:'afas',sourceHash,sourceReadSuccess:true,tenantRecordReadback:true,proofLevel:'PROVIDER_VERIFIED'}
};
const probeExecution={
 id:'44444444-4444-4444-8444-444444444444',organisatie_id:tenant,connector_id:id,
 connector_versie:3,status:'TEST_PASSED',afgerond_op:'2026-11-22T15:39:00Z',
 evidence:{sourceReadSuccess:true,proofLevel:'PROVIDER_VERIFIED'}
};
function health(args={}){
 return connectorHealthReport({connector,tenantId:tenant,executions:[sourceExecution,probeExecution],snapshot,now,...args});
}
const req=(method,path,body)=>({method,url:'https://www.bedrijfsgeheugen.nl'+path,...(body?{body:JSON.stringify(body)}:{})});
const user={id:'one',app_metadata:{tenant_id:tenant}};
test('health reports only independently read-back rows and source date, not imaginary automatic runs',()=>{
 const proof=health();
 assert.equal(proof.contract,'CONNECTOR_PROOF_HEALTH_V1');
 assert.equal(proof.status,'SOURCE_RECORDS_VERIFIED');
 assert.equal(proof.actualSourceDataVerified,true);
 assert.equal(proof.connectionVerified,true);
 assert.equal(proof.sourceRecordCount,2);
 assert.equal(proof.sourceAgeMinutes,20);
 assert.equal(proof.lastSourceReadAt,'2026-11-22T15:40:00Z');
 assert.equal(proof.requestedCadence,'Iedere 60 minuten');
 assert.equal(proof.automaticExecutionVerified,false);
 assert.equal(proof.nextScheduledAt,null);
 assert.equal(proof.lastExecutionState,'SOURCE_SYNCED');
 assert.equal(JSON.stringify(proof).includes('F-001'),false);
 assert.equal(JSON.stringify(proof).includes('125'),false);
});
test('provider sample tests do not prove source ingestion even with Active status',()=>{
 const probe=health({snapshot:null,executions:[probeExecution]});
 assert.equal(probe.actualSourceDataVerified,false);
 assert.equal(probe.connectionVerified,true);
 assert.equal(probe.status,'PROVIDER_CONNECTION_VERIFIED');
 const onlySample={...probeExecution,evidence:{proofLevel:'SAMPLE_ONLY',sourceReadSuccess:true}};
 const sample=health({snapshot:null,executions:[onlySample]});
 assert.equal(sample.status,'EVIDENCE_DUE');
 assert.equal(sample.connectionVerified,false);
});
test('source hash, version, tenant, provider and selected fields must match before showing confirmed data',()=>{
 const broken=[
 {...snapshot,connector_versie:2},{...snapshot,organisatie_id:otherTenant},
 {...snapshot,bron_hash:'b'.repeat(64)},{...snapshot,kolommen:['Factuurnummer','Bedrag']},
 {...snapshot,provider:'generic'},{...snapshot,bron_gecontroleerd:false},
 {...snapshot,get_connector:'AnotherConnector'},{...snapshot,aantal:4},
 {...snapshot,rijen:[[0]]},{...snapshot,ingelezen_op:'nonsense'}
 ];
 for(const bad of broken)assert.equal(health({snapshot:bad}).actualSourceDataVerified,false,
   'invalid source snapshot '+JSON.stringify(bad).slice(0,90));
 const wrongExecution={...sourceExecution,connector_versie:2};
 assert.equal(health({executions:[wrongExecution]}).actualSourceDataVerified,false);
 const otherExecution={...sourceExecution,organisatie_id:otherTenant};
 assert.equal(health({executions:[otherExecution]}).actualSourceDataVerified,false);
 const badProof={...sourceExecution,evidence:{...sourceExecution.evidence,tenantRecordReadback:false}};
 assert.equal(health({executions:[badProof]}).actualSourceDataVerified,false);
 assert.equal(health({connector:{...connector,state:'Draft'}}).actualSourceDataVerified,false);
});
test('old execution receipts cannot falsely validate a newly overwritten identical-hash snapshot',()=>{
 const older={...sourceExecution,afgerond_op:'2026-11-22T14:00:00Z'};
 const outcome=health({executions:[older],snapshot});
 assert.equal(outcome.actualSourceDataVerified,false);
 assert.equal(outcome.lastSourceReadAt,null);
});
test('identity mismatch and unversioned configuration fail closed',()=>{
 assert.throws(()=>health({tenantId:otherTenant}),/CONNECTOR_SCOPE_INVALID/);
 assert.throws(()=>health({connector:{...connector,version:0}}),/CONNECTOR_VERSION_INVALID/);
});
test('actual verified source sync alone establishes provider connectivity when probe is no longer in latest history',()=>{
 const proof=health({executions:[sourceExecution]});
 assert.equal(proof.status,'SOURCE_RECORDS_VERIFIED');
 assert.equal(proof.connectionVerified,true);
});
test('unauthenticated and wrong-tenant monitor endpoints never expose source proof',async()=>{
 const store={
  configured:true,
  get:async(t,cid)=>t===tenant&&cid===id?connector:null,
  listExecutions:async()=>[sourceExecution,probeExecution],
  getSourceSnapshot:async()=>snapshot
 };
 const path='/api/connectors/'+id+'/health';
 const good=await handlePortalConnectorsRequest({request:req('GET',path),user,store});
 assert.equal(good.status,200);
 const data=await good.json();
 assert.equal(data.actualSourceDataVerified,true);
 assert.equal(data.sourceRecordCount,2);
 assert.equal(JSON.stringify(data).includes('F-001'),false);
 const anonymous=await handlePortalConnectorsRequest({request:req('GET',path),user:null,store});
 assert.equal(anonymous.status,401);
 const wrong=await handlePortalConnectorsRequest({request:req('GET',path),user:{id:'other',app_metadata:{tenant_id:otherTenant}},store});
 assert.equal(wrong.status,404);
});
test('updating saved custom connector revalidates interval and invalidates prior active configuration',async()=>{
 const template=buildCustomConnectorTemplate({sourceId:'salesforce',targetId:'datahub',fields:['recordId','changedAt','amount']});
 const before={...toConnectorDefinition(createWizardState(template)),id,tenantId:tenant,version:2,state:'Active'};
 let saved=null;
 const store={
  configured:true,
  get:async(t,cid)=>t===tenant&&cid===id?before:null,
  saveDraft:async(t,record)=>{saved={...record,tenantId:t};return saved;}
 };
 const updated={...before,transferPolicy:{...DEFAULT_TRANSFER_POLICY,trigger:'INTERVAL',
   intervalMinutes:1440,purpose:'Sales via de datahub',owner:'Sales'}};
 const result=await handlePortalConnectorsRequest({
  request:req('PUT','/api/connectors/'+id+'/draft',updated),user,store});
 const payload=await result.json();
 assert.equal(result.status,200,JSON.stringify(payload));
 assert.equal(payload.state,'Draft');
 assert.equal(payload.version,3);
 assert.equal(saved.transferPolicy.trigger,'INTERVAL');
 assert.equal(saved.transferPolicy.intervalMinutes,1440);
 assert.equal(payload.runtime?.activationEvidence,undefined);
});
test('saved custom connector edits reject forged frequency, provider swap and transfer policy stripping',async()=>{
 const template=buildCustomConnectorTemplate({sourceId:'salesforce',targetId:'datahub',fields:['recordId']});
 const prior={...toConnectorDefinition(createWizardState(template)),id,tenantId:tenant,version:1,state:'Active'};
 const store={configured:true,get:async()=>prior,saveDraft:async()=>{throw Error('SHOULD_NOT_WRITE');}};
 const path='/api/connectors/'+id+'/draft';
 const testCase=async(body,status,code)=>{
   const response=await handlePortalConnectorsRequest({request:req('PUT',path,body),user,store});
   assert.equal(response.status,status);
   assert.equal((await response.json()).error,code);
 };
 await testCase({...prior,transferPolicy:{...prior.transferPolicy,trigger:'INTERVAL',intervalMinutes:2}},422,'TRANSFER_INTERVAL_INVALID');
 await testCase({...prior,transferPolicy:undefined},422,'TRANSFER_POLICY_CANNOT_BE_DROPPED');
 await testCase({...prior,source:{...prior.source,providerId:'shopify'}},422,'CUSTOM_PROVIDER_CONTRACT_INVALID');
});
test('studio UI allows explicit editing and only shows real health proof returned by secured API',async()=>{
 const [view,api,handler,source]=await Promise.all([
  readFile(new URL('../assets/js/koppelingen/view.js',import.meta.url),'utf8'),
  readFile(new URL('../assets/js/koppelingen/api.js',import.meta.url),'utf8'),
  readFile(new URL('../platform/api/portal-connectors-handler.mjs',import.meta.url),'utf8'),
  readFile(new URL('../platform/connectors/connector-operations-proof.mjs',import.meta.url),'utf8')
 ]);
 assert.match(view,/Bewerk richting en frequentie/);
 assert.match(view,/Bekijk echte synchronisatiestatus/);
 assert.match(view,/invalidateEvidence\('Bestaande instelling geopend/);
 assert.match(view,/report\.actualSourceDataVerified/);
 assert.match(view,/automaticExecutionVerified/);
 assert.match(view,/monitor\.textContent/);
 assert.match(api,/health:id/);
 assert.match(handler,/connectorHealthReport/);
 assert.match(handler,/validateTransferIntent\(body\)/);
 assert.match(source,/CONFIGUR/mi);
 assert.doesNotMatch(view,/localStorage|sessionStorage/);
});
