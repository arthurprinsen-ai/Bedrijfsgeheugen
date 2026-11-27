import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 DEFAULT_TRANSFER_POLICY,normalizeTransferPolicy,connectorTransferActivationGuard,
 connectorTransferSyncGuard,TRANSFER_INTERVALS,transferSummary
} from '../assets/js/koppelingen/transfer-policy.js';
import {
 CONNECTOR_PROVIDER_CATALOG,findConnectorProvider,providerCapabilityLabel,buildCustomConnectorTemplate
} from '../assets/js/koppelingen/provider-catalog.js';
import {createWizardState,applyAnswer,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

const afas={id:'33333333-3333-4333-8333-333333333333',name:'AFAS echte bron',version:3,state:'Active',
 source:{type:'afas',environment:'12345',getConnector:'BG_Verkoop'},
 target:{type:'datahub'},documentSchema:{fields:['Factuurnummer','Gewijzigd','Bedrag']},
 dataUse:{mode:'PORTAL_INSIGHTS',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'},
 routing:{portalPages:['cijfers-maatstaven'],selectedFields:['Bedrag']}};
const tenant='11111111-1111-4111-8111-111111111111';
const auth={id:'user-one',app_metadata:{tenant_id:tenant}};
const request=(method,path,body)=>({
 method,url:'https://www.bedrijfsgeheugen.nl'+path,
 ...(body!==undefined?{body:JSON.stringify(body)}:{})
});
const act=(req,store,user=auth)=>handlePortalConnectorsRequest({request:req,user,store,
 engine:{activationEligibility:()=>({eligible:true})}});
function policy(patch={}){
 return {...DEFAULT_TRANSFER_POLICY,...patch};
}
test('all chosen time intervals have a deterministic clear meaning and never imply an executor',()=>{
 assert.deepEqual(TRANSFER_INTERVALS,[5,15,30,60,180,360,720,1440,10080]);
 for(const m of TRANSFER_INTERVALS){
  const result=normalizeTransferPolicy(policy({trigger:'INTERVAL',intervalMinutes:m}),afas.documentSchema);
  assert.equal(result.intervalMinutes,m);
  assert.equal(transferSummary(result).executionClaim,'CONFIGURATION_ONLY_UNTIL_PROVIDER_AND_SCHEDULER_PROOF');
  assert.deepEqual(connectorTransferActivationGuard({...afas,transferPolicy:result}),{
   allowed:false,reason:'AUTOMATIC_CONNECTOR_EXECUTOR_NOT_VERIFIED'
  });
 }
});
test('invalid frequency, unknown attrs, event/interval collisions, policy injection fail closed',()=>{
 for(const shape of [
   policy({trigger:'INTERVAL',intervalMinutes:0}),policy({trigger:'INTERVAL',intervalMinutes:2}),
   policy({trigger:'MANUAL',intervalMinutes:60}),
   policy({trigger:'WEBHOOK',intervalMinutes:5}),
   policy({trigger:'CDC',intervalMinutes:15}),
   policy({initialLoad:'EVERYTHING_UNLIMITED'}),
   policy({direction:'MAGIC'}),
   policy({evilKey:true}),policy({purpose:'good\u0001bad'}),
   policy({dataContractVersion:999})
 ]){
  assert.throws(()=>normalizeTransferPolicy(shape,afas.documentSchema));
 }
});
test('reverse and bidirectional are definable but blocked until real read-write adapters and conflict handling',()=>{
 const reverse=normalizeTransferPolicy(policy({direction:'TARGET_TO_SOURCE'}),afas.documentSchema);
 assert.equal(connectorTransferActivationGuard({...afas,transferPolicy:reverse}).reason,'REVERSE_OR_TWO_WAY_ADAPTER_NOT_VERIFIED');
 const two=normalizeTransferPolicy(policy({direction:'BIDIRECTIONAL',primaryKey:'Factuurnummer'}),afas.documentSchema);
 assert.equal(connectorTransferActivationGuard({...afas,transferPolicy:two}).reason,'REVERSE_OR_TWO_WAY_ADAPTER_NOT_VERIFIED');
 assert.throws(()=>normalizeTransferPolicy(policy({direction:'BIDIRECTIONAL'}),afas.documentSchema),/TRANSFER_TWO_WAY_KEY_REQUIRED/);
 assert.throws(()=>normalizeTransferPolicy(policy({direction:'BIDIRECTIONAL',primaryKey:'Factuurnummer',conflictPolicy:'SOURCE_WINS'}),afas.documentSchema),/TRANSFER_TWO_WAY_REVIEW_REQUIRED/);
 assert.throws(()=>normalizeTransferPolicy(policy({direction:'BIDIRECTIONAL',primaryKey:'Factuurnummer',deletionPolicy:'TOMBSTONE'}),afas.documentSchema),/TRANSFER_TWO_WAY_DELETE_REVIEW_REQUIRED/);
});
test('incremental upsert requires a primary key AND source change cursor; no silent guessed keys',()=>{
 assert.throws(()=>normalizeTransferPolicy(policy({mode:'INCREMENTAL_UPSERT'}),afas.documentSchema),/TRANSFER_INCREMENTAL_KEYS_REQUIRED/);
 assert.throws(()=>normalizeTransferPolicy(policy({mode:'INCREMENTAL_UPSERT',primaryKey:'NonExisting',cursorField:'Gewijzigd'}),afas.documentSchema),/TRANSFER_FIELD_NOT_IN_SCHEMA/);
 const inc=normalizeTransferPolicy(policy({mode:'INCREMENTAL_UPSERT',primaryKey:'Factuurnummer',cursorField:'Gewijzigd'}),afas.documentSchema);
 assert.equal(inc.cursorField,'Gewijzigd');
 assert.equal(connectorTransferActivationGuard({...afas,transferPolicy:inc}).reason,'DELTA_OR_APPEND_ADAPTER_NOT_VERIFIED');
});
test('deletion, backfill, append and CDC cannot be activated by template text',()=>{
 for(const modify of [
  {deletionPolicy:'REVIEW_FIRST'}, {deletionPolicy:'TOMBSTONE'},
  {initialLoad:'LAST_30_DAYS'},{initialLoad:'ALL_AUTHORIZED'},
  {mode:'APPEND_ONLY'}, {trigger:'CDC'}, {trigger:'WEBHOOK'}
 ]){
  const p=normalizeTransferPolicy(policy(modify),afas.documentSchema);
  assert.equal(connectorTransferActivationGuard({...afas,transferPolicy:p}).allowed,false);
 }
});
test('only explicitly verified AFAS read-only manual snapshot may reach original activation gate',()=>{
 assert.equal(connectorTransferActivationGuard({...afas,transferPolicy:policy()}).allowed,true);
 assert.equal(connectorTransferSyncGuard({...afas,transferPolicy:policy()}).allowed,true);
 assert.equal(connectorTransferActivationGuard(afas).reason,'LEGACY_CONNECTOR_GATES');
 assert.deepEqual(connectorTransferActivationGuard({
  ...afas,source:{type:'api',providerId:'salesforce'},transferPolicy:policy()
 }),{allowed:false,reason:'PROVIDER_ADAPTER_NOT_VERIFIED'});
});
test('independently selectable broad catalogue never claims that provider OAuth is already connected',()=>{
 assert.ok(CONNECTOR_PROVIDER_CATALOG.length>=35);
 assert.equal(findConnectorProvider('afas').capability,'VERIFIED_READ_ONLY_ADAPTER');
 assert.equal(findConnectorProvider('salesforce').capability,'DESIGN_ONLY');
 assert.equal(findConnectorProvider('exact').capability,'DESIGN_ONLY');
 assert.match(providerCapabilityLabel('shopify'),/providerconnector nog niet aangesloten/);
 assert.equal(CONNECTOR_PROVIDER_CATALOG.some(p=>p.auth==='token-in-browser'),false);
});
test('generic source and target remain independent and preserve selected fields in normal wizard',()=>{
 const template=buildCustomConnectorTemplate({
  sourceId:'salesforce',targetId:'datahub',fields:['recordId','Gewijzigd','Bedrag']});
 let state=createWizardState(template);
 state=applyAnswer(state,'dataUseMode','PORTAL_INSIGHTS');
 state=applyAnswer(state,'portalPages',['cijfers-maatstaven']);
 state=applyAnswer(state,'transferPolicy',policy({
  trigger:'INTERVAL',intervalMinutes:60,mode:'INCREMENTAL_UPSERT',
  primaryKey:'recordId',cursorField:'Gewijzigd',purpose:'Sales vergelijken',owner:'Sales Ops'}));
 const definition=toConnectorDefinition(state);
 assert.equal(definition.source.type,'api');assert.equal(definition.source.providerId,'salesforce');
 assert.equal(definition.target.type,'datahub');assert.equal(definition.target.providerId,'datahub');
 assert.deepEqual(definition.routing.portalPages,['cijfers-maatstaven']);
 assert.deepEqual(definition.routing.selectedFields,['recordId','Gewijzigd','Bedrag']);
 assert.equal(definition.schedule.refreshMinutes,60);
 assert.equal(definition.transferPolicy.purpose,'Sales vergelijken');
 assert.ok(definition.mappings.every(m=>m.transformation.type==='none'));
 assert.equal(connectorTransferActivationGuard(definition).allowed,false);
});
test('custom sources cannot silently choose invalid provider, identical endpoints or unsafe target',()=>{
 for(const x of [
  {sourceId:'https://127.0.0.1',targetId:'datahub',fields:['id']},
  {sourceId:'salesforce',targetId:'salesforce',fields:['id']},
  {sourceId:'salesforce',targetId:'datahub',fields:[]},
  {sourceId:'salesforce',targetId:'datahub',fields:['a b']},
  {sourceId:'salesforce',targetId:'datahub',fields:['id','id']},
  {sourceId:'salesforce',targetId:'sftp',fields:['id']}
 ])assert.throws(()=>buildCustomConnectorTemplate(x));
});
test('authenticated draft validation persists plan as versioned metadata and rejects tampering',async()=>{
 let persisted;
 const store={
  configured:true,saveDraft:async(t,body)=>{persisted={tenant:t,...body};return {id:afas.id,...body};},
  get:async()=>persisted?{...persisted,id:afas.id}:null
 };
 const definition=toConnectorDefinition(createWizardState(buildCustomConnectorTemplate({
  sourceId:'salesforce',targetId:'datahub',fields:['recordId']})));
 const created=await act(request('POST','/api/connectors',definition),store);
 assert.equal(created.status,201);assert.equal(persisted.transferPolicy.direction,'SOURCE_TO_TARGET');
 assert.equal(persisted.transferPolicy.trigger,'MANUAL');
 assert.equal(persisted.tenant,tenant);
 const tampered=await act(request('POST','/api/connectors',{
  ...definition,source:{...definition.source,providerId:'http://localhost'}
 }),store);
 assert.equal(tampered.status,422);assert.equal((await tampered.json()).error,'CUSTOM_PROVIDER_CONTRACT_INVALID');
 const invalid=await act(request('POST','/api/connectors',{
  ...definition,transferPolicy:{...definition.transferPolicy,trigger:'INTERVAL',intervalMinutes:2}
 }),store);
 assert.equal(invalid.status,422);
 assert.equal((await invalid.json()).error,'TRANSFER_INTERVAL_INVALID');
 const noAuth=await act(request('POST','/api/connectors',definition),store,null);
 assert.equal(noAuth.status,401);
});
test('activation rejects auto schedule, two-way and unsupported providers despite forged successful external proof',async()=>{
 const store={
  configured:true,get:async()=>({...afas,transferPolicy:policy({trigger:'INTERVAL',intervalMinutes:60})}),
  getExecution:async()=>({id:'99999999-9999-4999-8999-999999999999',status:'TEST_PASSED',connector_versie:3})
 };
 const response=await act(request('POST','/api/connectors/'+afas.id+'/activate',{
  testExecutionId:'99999999-9999-4999-8999-999999999999'
 }),store);
 assert.equal(response.status,409);
 assert.equal((await response.json()).error,'AUTOMATIC_CONNECTOR_EXECUTOR_NOT_VERIFIED');
});
test('AFAS manual sync route rejects modified direction even if connector previously Active',async()=>{
 const store={configured:true,get:async()=>({...afas,transferPolicy:policy({direction:'BIDIRECTIONAL',primaryKey:'Factuurnummer'})})};
 const response=await act(request('POST','/api/connectors/'+afas.id+'/sync',{}),store);
 assert.equal(response.status,409);assert.equal((await response.json()).error,'REVERSE_OR_TWO_WAY_ADAPTER_NOT_VERIFIED');
});
test('UI has native source/target selectors, cadence, conflict controls, clear capability warnings and no browser tokens',async()=>{
 const [view,wizard,policySource,backend]=await Promise.all([
 readFile(new URL('../assets/js/koppelingen/view.js',import.meta.url),'utf8'),
 readFile(new URL('../assets/js/koppelingen/wizard.js',import.meta.url),'utf8'),
 readFile(new URL('../assets/js/koppelingen/transfer-policy.js',import.meta.url),'utf8'),
 readFile(new URL('../platform/api/portal-connectors-handler.mjs',import.meta.url),'utf8')
 ]);
 for(const token of ['data-bg-custom-source','data-bg-custom-target','data-bg-custom-fields','data-bg-custom-create','data-bg-transfer-key="direction"','data-bg-transfer-key="trigger"','data-bg-transfer-key="intervalMinutes"','data-bg-transfer-key="primaryKey"','data-bg-transfer-key="conflictPolicy"','data-bg-transfer-key="deletionPolicy"','data-bg-transfer-key="failurePolicy"'])
  assert.ok(view.includes(token),token);
 assert.match(view,/Een opgeslagen ontwerp is nog geen live providerverbinding/);
 assert.match(wizard,/transferPolicy/);
 assert.match(backend,/connectorTransferActivationGuard/);
 assert.match(backend,/TRANSFER_POLICY_CANNOT_BE_DROPPED/);
 assert.match(policySource,/AUTOMATIC_CONNECTOR_EXECUTOR_NOT_VERIFIED/);
 assert.doesNotMatch(view,/localStorage|sessionStorage|Bearer [A-Za-z0-9]{30}/);
});
