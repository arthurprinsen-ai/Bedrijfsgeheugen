import test from 'node:test';
import assert from 'node:assert/strict';
import {CONNECTOR_PORTAL_PAGES,normalizeConnectorRouting,connectorPortalSources} from '../assets/js/koppelingen/portal-routing.js';
import {connectorRecoveryAdvice} from '../assets/js/koppelingen/recovery.js';
import {createWizardState,applyAnswer,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';
import {findTemplate} from '../assets/js/koppelingen/templates.js';
import {renderWizardShell} from '../assets/js/koppelingen/view.js';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

const schema={fields:[{key:'bedrag'},{key:'leverancier'}]};
const consent={mode:'PORTAL_INSIGHTS'};
const basic={id:'connector-secret-id',name:'Test BV',state:'Active',source:{type:'exact',apiKey:'NOT_TO_BROWSER'},
 dataUse:{mode:'PORTAL_INSIGHTS'},routing:{portalPages:['cijfers-maatstaven','datahubstatus'],selectedFields:['bedrag']},
 runtime:{activationEvidence:{proofLevel:'SAMPLE_ONLY',token:'NOT_TO_BROWSER'}}};

test('multi-page routing is strict allowlist and only selected document fields',()=>{
 assert.ok(CONNECTOR_PORTAL_PAGES.length>=8);
 assert.deepEqual(normalizeConnectorRouting({portalPages:['cijfers-maatstaven','roadmap'],selectedFields:['bedrag']},schema,consent).portalPages,['cijfers-maatstaven','roadmap']);
 for(const bad of [
 {portalPages:['arbitrary'],selectedFields:['bedrag']},
 {portalPages:['cijfers-maatstaven','cijfers-maatstaven'],selectedFields:['bedrag']},
 {portalPages:['cijfers-maatstaven'],selectedFields:['apiKey']},
 {portalPages:['cijfers-maatstaven'],selectedFields:['bedrag','bedrag']}
 ]) assert.throws(()=>normalizeConnectorRouting(bad,schema,consent),{code:'INVALID_CONNECTOR_ROUTING'});
 assert.throws(()=>normalizeConnectorRouting({portalPages:['brain-verwerking'],selectedFields:['bedrag']},schema,{mode:'CONNECTION_ONLY'}),{code:'INVALID_CONNECTOR_ROUTING'});
});

test('wizard can select multiple fields/pages independently and never silently grants AI',()=>{
 let state=createWizardState(findTemplate('outlook-pdf-facturen'));
 state=applyAnswer(state,'dataUseMode','PORTAL_INSIGHTS');
 state=applyAnswer(state,'selectedFields',['factuurnummer','bedrag']);
 state=applyAnswer(state,'portalPages',['cijfers-maatstaven','datahubstatus']);
 const def=toConnectorDefinition(state);
 assert.deepEqual(def.mappings.map(item=>item.sourceField),['factuurnummer','bedrag']);
 assert.deepEqual(def.routing.portalPages,['cijfers-maatstaven','datahubstatus']);
 assert.equal(def.dataUse.mode,'PORTAL_INSIGHTS');
 const shell=renderWizardShell();
 assert.match(shell,/data-bg-fieldchoices/);
 assert.match(shell,/data-bg-pagechoices/);
 assert.match(shell,/data-bg-evidence/);
});

test('source placement reveals only metadata and never converts example tests to live data',()=>{
 const result=connectorPortalSources([basic], 'cijfers-maatstaven');
 assert.equal(result.length,1);
 assert.equal(result[0].dataStatus,'LIVE_RECORDS_NOT_VERIFIED');
 assert.deepEqual(result[0].fields,['bedrag']);
 assert.doesNotMatch(JSON.stringify(result),/NOT_TO_BROWSER|apiKey|token/);
 assert.deepEqual(connectorPortalSources([basic],'brain-verwerking'),[]);
 assert.deepEqual(connectorPortalSources([{...basic,dataUse:{mode:'PORTAL_AI'},routing:{portalPages:['brain-verwerking'],selectedFields:['bedrag']}}],'brain-verwerking').map(x=>x.dataUse),['PORTAL_AI']);
 assert.deepEqual(connectorPortalSources([basic],'arbitrary'),[]);
});

test('diagnostics never display raw provider payloads or suggest bypassing permission',()=>{
 const auth=connectorRecoveryAdvice({code:'UNAUTHORIZED',message:'token=SHOULD_NOT_APPEAR'});
 assert.equal(auth.canRetry,false);
 assert.equal(auth.requiresHuman,true);
 assert.doesNotMatch(JSON.stringify(auth),/SHOULD_NOT_APPEAR/);
 const transient=connectorRecoveryAdvice({code:'HTTP_503',status:503});
 assert.equal(transient.canRetry,true);
 assert.equal(transient.maxAutomaticSafeTestRetries,1);
 assert.equal(connectorRecoveryAdvice({code:'DATA_SOVEREIGNTY_CONNECTOR_BLOCKED'}).canRetry,false);
});

test('API page-source listing is scoped to authenticated tenant, never raw record or secret',async()=>{
 const calls=[];
 const store={configured:true,async list(tenant){calls.push(tenant);return [basic];}};
 const request={method:'GET',path:'/api/connectors/page-sources?page=cijfers-maatstaven'};
 const res=await handlePortalConnectorsRequest({request,user:{id:'u1',tenantId:'tenant-a'},store});
 assert.equal(res.status,200);
 const body=await res.json();
 assert.equal(body.truth,'CONNECTOR_METADATA_ONLY_NO_LIVE_DATA');
 assert.equal(body.items.length,1);
 assert.deepEqual(calls,['tenant-a']);
 assert.doesNotMatch(JSON.stringify(body),/NOT_TO_BROWSER|apiKey|token/);
 const invalid=await handlePortalConnectorsRequest({request:{method:'GET',path:'/api/connectors/page-sources?page=wrong'},user:{id:'u1',tenantId:'tenant-a'},store});
 assert.equal(invalid.status,422);
 const denied=await handlePortalConnectorsRequest({request,user:null,store});
 assert.equal(denied.status,401);
});

test('API refuses forged cross-page/field destinations before persistence',async()=>{
 let saveCount=0;
 const store={configured:true,async saveDraft(){saveCount++;return {};}};
 const body={source:{type:'upload'},target:{type:'datahub'},documentSchema:schema,
 dataUse:{mode:'PORTAL_INSIGHTS'},routing:{portalPages:['other-tenant-hidden'],selectedFields:['bedrag']}};
 const response=await handlePortalConnectorsRequest({request:{method:'POST',path:'/api/connectors',body},user:{id:'u1',tenantId:'tenant-a'},store});
 assert.equal(response.status,422);
 assert.deepEqual(await response.json(),{error:'INVALID_CONNECTOR_ROUTING'});
 assert.equal(saveCount,0);
});
