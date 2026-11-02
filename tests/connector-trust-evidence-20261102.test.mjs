import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildConnectorTrustReport} from '../platform/connectors/connector-trust-report.mjs';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';
const ID='11111111-1111-4111-8111-111111111111',SECRET='EXTERNAL_PROVIDER_SECRET_NEVER_SHOW';
const connector={id:ID,name:'Private '+SECRET,version:3,state:'Active',dataUse:{mode:'PORTAL_INSIGHTS'},
 routing:{selectedFields:['amount'],portalPages:['cijfers-maatstaven']},runtime:{token:SECRET}};
const evidence={configVersion:3,sourceReadSuccess:true,proofLevel:'PROVIDER_VERIFIED',
 extractionResult:{ok:true},validationResult:{ok:true},targetSafeTestResult:{ok:true,reference:'target-test'}};
test('active config and dry-run are never called verified customer data or security',()=>{
 const report=buildConnectorTrustReport(connector,{executions:[{status:'TEST_PASSED',connector_versie:3,evidence:{...evidence,proofLevel:'SAMPLE_ONLY'}}]});
 assert.equal(report.overall,'EVIDENCE_DUE');assert.equal(report.safeToClaimLiveData,false);assert.equal(report.fullySecurityVerified,false);
 assert.equal(report.providerTestRecorded,false);
 assert.equal(report.checks.find(x=>x.id==='storage').status,'EVIDENCE_DUE');
 assert.equal(report.checks.find(x=>x.id==='portal').status,'EVIDENCE_DUE');
 assert.doesNotMatch(JSON.stringify(report),/EXTERNAL_PROVIDER_SECRET_NEVER_SHOW/);
});
test('provider test is version checked and never implies live data ingestion',()=>{
 const ok=buildConnectorTrustReport(connector,{executions:[{status:'TEST_PASSED',connector_versie:3,evidence}]});
 assert.equal(ok.providerTestRecorded,true);assert.equal(ok.checks.find(x=>x.id==='provider').status,'TEST_EVIDENCED');
 assert.equal(ok.safeToClaimLiveData,false);assert.equal(ok.overall,'EVIDENCE_DUE');
 const stale=buildConnectorTrustReport(connector,{executions:[{status:'TEST_PASSED',connector_versie:2,evidence}]});
 assert.equal(stale.providerTestRecorded,false);
});
test('AI disabled by default is not implicitly granted',()=>{
 const result=buildConnectorTrustReport({...connector,dataUse:{mode:'CONNECTION_ONLY'}});
 assert.equal(result.checks.find(x=>x.id==='ai').status,'DISABLED');
});
test('trust endpoint scopes by authenticated tenant, not attacker-supplied query',async()=>{
 const calls=[];const store={configured:true,
  get:async(tenant,id)=>{calls.push(['get',tenant,id]);return tenant==='tenant-a'&&id===ID?connector:null;},
  listExecutions:async(tenant,id)=>{calls.push(['listExecutions',tenant,id]);return [{status:'TEST_PASSED',connector_versie:3,evidence}];}
 };
 const request={method:'GET',path:'/api/connectors/'+ID+'/trust?tenant=tenant-b'};
 const response=await handlePortalConnectorsRequest({request,user:{id:'u1',tenantId:'tenant-a'},store});
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.equal((await response.json()).contract,'CONNECTOR_TRUST_EVIDENCE_V1');
 assert.deepEqual(calls,[['get','tenant-a',ID],['listExecutions','tenant-a',ID]]);
 const denied=await handlePortalConnectorsRequest({request,user:{id:'u2',tenantId:'tenant-b'},store});
 assert.equal(denied.status,404);
 assert.equal((await handlePortalConnectorsRequest({request,user:null,store})).status,401);
});
test('untrusted provider error text and code never persist or reach client',async()=>{
 const writes=[];const store={configured:true,get:async()=>connector,
  saveExecution:async(_,row)=>{writes.push(row);return{id:'33333333-3333-4333-8333-333333333333'};},
  saveDraft:async(_,row)=>{writes.push(row);return row;}};
 const engine={runTest:async()=>{throw Object.assign(new Error('leak '+SECRET),{code:'AUTH_'+SECRET,failedStage:'source_'+SECRET,executionId:SECRET});},
 classifyError:()=>({class:'auth',retryable:false,maxAttempts:0,recoveryRequired:true})};
 const response=await handlePortalConnectorsRequest({request:{method:'POST',path:'/api/connectors/'+ID+'/test',body:{sample:{}}},user:{id:'u1',tenantId:'tenant-a'},store,engine});
 assert.equal(response.status,422);
 const payload=await response.json();assert.equal(payload.error,'CONNECTOR_TEST_FAILED');assert.equal(payload.failedStage,'runtime');
 assert.doesNotMatch(JSON.stringify(payload),/EXTERNAL_PROVIDER_SECRET_NEVER_SHOW/);
 assert.doesNotMatch(JSON.stringify({execution:writes[0],newRecovery:writes[1]?.runtime?.recoveryObligation}),/EXTERNAL_PROVIDER_SECRET_NEVER_SHOW/);
 assert.equal(writes[0].error.code,'CONNECTOR_TEST_FAILED');
});
test('UI renders plain-text trust evidence, never raw provider markup',()=>{
 const source=readFileSync(new URL('../assets/js/koppelingen/view.js',import.meta.url),'utf8');
 assert.match(source,/api\.trust\(item\.id\)/);assert.match(source,/detail\.textContent=control\.detail/);
 assert.match(source,/aria-expanded/);
});
