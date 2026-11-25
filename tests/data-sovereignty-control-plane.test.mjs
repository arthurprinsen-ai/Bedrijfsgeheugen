import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AI_DEPLOYMENT_OPTIONS,CURRENT_AI_DEPLOYMENT_PROFILE,validateCustomerAiDeployment,canUseCurrentAiRoute} from '../platform/policy/customer-ai-deployment.mjs';
import {createDataSovereigntyClient} from '../netlify/functions/_data-sovereignty-client.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('data sovereignty API is tenant-bound and Supabase Edge is explicitly invoked in Frankfurt',async()=>{
 const api=await read('netlify/functions/data-sovereignty.mjs');
 assert.match(api,/resolveIdentityTenant/);
 assert.match(api,/scope.*bedrijfsgeheugen/);
 const client=await read('netlify/functions/_data-sovereignty-client.mjs');
 assert.match(client,/x-region.*eu-central-1/);
 assert.match(client,/DATA_SOVEREIGNTY_AI_BLOCKED/);
 assert.match(client,/DATA_SOVEREIGNTY_CONNECTOR_BLOCKED/);
});

test('Netlify is never declared EU-pinned by unsupported per-function configuration',async()=>{
 const toml=await read('netlify.toml');
 for(const name of ['portal-state','portal-business-input','portal-project','portal-connectors','portaalvraag','connector-ai-guide','document-extractor','i18n-translate','portal-entitlements','portal-feedback','portal-ondernemersdata','portal-prediction-intelligence','portal-scans','data-sovereignty','data-sovereignty-runtime-proof','powerhouse-commercial-heartbeat-background','powerhouse-commercial-heartbeat-schedule']){
   assert.doesNotMatch(toml,new RegExp('\\[functions\\."'+name+'"\\][\\s\\S]{0,100}region\\s*=\\s*"fra"'),name);
 }
});

test('Netlify Blob stores do not claim an unsupported physical EU region option',async()=>{
 const projection=await read('netlify/functions/_portal-read-model-store.mjs');
 const feedback=await read('netlify/functions/portal-feedback.mjs');
 assert.doesNotMatch(projection,/region:\s*'eu-central-1'/);
 assert.doesNotMatch(feedback,/region:\s*'eu-central-1'/);
 const correction=await read('supabase/migrations/20261007112412_netlify_runtime_residency_truth_v2.sql');
 for(const token of ['PLATFORM_ROUTED_UNPINNED','PLATFORM_MANAGED_UNKNOWN_REGION','POSSIBLE_OUTSIDE_EEA','OBSERVATION_ONLY'])assert.match(correction,new RegExp(token));
});

test('runtime proof is observation evidence only and can never self-certify Netlify EU residency',async()=>{
 const proof=await read('netlify/functions/data-sovereignty-runtime-proof.mjs');
 assert.match(proof,/runtimeRegionObservation:true/);
 assert.match(proof,/functionsRegionGuarantee:false/);
 assert.match(proof,/blobRegionGuarantee:false/);
 assert.match(proof,/euOnlyGuarantee:false/);
 assert.match(proof,/verified:false/);
 const hb=await read('netlify/functions/powerhouse-commercial-heartbeat-background.mjs');
 assert.match(hb,/observeDataSovereignty/);
 assert.match(hb,/data_sovereignty_provider_observe/);
 assert.match(hb,/OBSERVATION_UNAVAILABLE/);
 assert.doesNotMatch(hb,/SOVEREIGNTY_RUNTIME_PROOF_FAILED/);
});

test('compliance page contains live data sovereignty control plane with absolute asset urls',async()=>{
 const html=await read('portal-next/compliance.html');
 assert.match(html,/bg-data-sovereignty-panel/);
 assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/data-sovereignty-panel\.js/);
 assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/data-sovereignty-panel\.css/);
});

test('EU-only policy is fail-closed and heartbeat refreshes sovereignty snapshots',async()=>{
 const edge=await read('supabase/functions/portal-state-eu/index.ts');
 assert.match(edge,/data_sovereignty_policy_set/);
 assert.match(edge,/EU_ONLY/);
 assert.match(edge,/enforcement_mode/);
 const hb=await read('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts');
 assert.match(hb,/powerhouse_refresh_data_sovereignty_v1/);
});

test('sovereignty snapshot models flows connectors and evidence instead of provider labels only',async()=>{
 const migration=await read('supabase/migrations/20261007110248_data_sovereignty_runtime_and_connector_truth_v1.sql');
 assert.match(migration,/data_sovereignty_flow_registry_v1/);
 assert.match(migration,/data_sovereignty_adapter_registry_v1/);
 assert.match(migration,/connector_definitions/);
 assert.match(migration,/evidence_status<>'VERIFIED'/);
 const panel=await read('portal-next/data-sovereignty-panel.js');
 for(const token of ['Dataflows','Mijn koppelingen','evidenceUrls','preferredAiRegion'])assert.match(panel,new RegExp(token));
});

test('confidential AI is blocked by tenant sovereignty policy before model invocation',async()=>{
 const brain=await read('netlify/functions/_brain-ai.mjs');
 const connector=await read('netlify/functions/_connector-ai.mjs');
 const question=await read('platform/api/portal-question-handler.mjs');
 assert.match(brain,/assertTenantAiAllowed/);
 assert.match(brain,/DATA_SOVEREIGNTY_TENANT_REQUIRED/);
 assert.match(connector,/assertAiAllowed/);
 assert.match(question,/DATA_SOVEREIGNTY_AI_BLOCKED/);
});

test('connector test and activation are both blocked before external processing when sovereignty evidence fails',async()=>{
 const fn=await read('netlify/functions/portal-connectors.mjs');
 const handler=await read('platform/api/portal-connectors-handler.mjs');
 assert.match(fn,/createDataSovereigntyClient/);
 const testAction=handler.indexOf("action==='test'");
 const activateAction=handler.indexOf("action==='activate'");
 const testGuard=handler.indexOf('assertConnectorAllowed',testAction);
 const runTest=handler.indexOf('engine.runTest',testGuard);
 const activationGuard=handler.indexOf('assertConnectorAllowed',activateAction);
 const active=handler.indexOf("state:'Active'",activationGuard);
 assert.ok(testAction>=0&&testGuard>testAction&&runTest>testGuard,'test guard must run before engine.runTest');
 assert.ok(activateAction>=0&&activationGuard>activateAction&&active>activationGuard,'activation guard must run before Active state');
});

test('sovereignty files contain no interruption escape artifacts',async()=>{
 for(const p of ['portal-next/compliance.html','netlify/functions/i18n-translate.mjs','netlify/functions/portaalvraag.mjs','netlify/functions/connector-ai-guide.mjs','supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts']){
   const src=await read(p);
   assert.doesNotMatch(src,/\\\\n(?:import|\s*<|\s*const|\s*data_sovereignty)/,p);
 }
});

// Customer-selected AI deployment, model and data residency regressions.
const profile=(patch={})=>({...CURRENT_AI_DEPLOYMENT_PROFILE,...patch});
const local=profile({deploymentMode:'ON_PREMISE',provider:'OLLAMA',modelFamily:'MISTRAL',computeRegion:'LOCAL',storageRegion:'LOCAL',ragRegion:'LOCAL'});
const fakeClient=policy=>createDataSovereigntyClient({
 baseUrl:'https://example.supabase.co',serviceToken:'test-only',
 fetchFn:async (_url,options)=>({ok:true,json:async()=>({snapshot:{policy,violations:[],connectors:[]}})})
});

test('customer can select deployment, provider, inference, document and RAG location independently',()=>{
 for(const key of ['deploymentMode','provider','modelFamily','computeRegion','storageRegion','ragRegion','networkMode'])
  assert.ok(AI_DEPLOYMENT_OPTIONS[key].length>1,key);
 assert.equal(validateCustomerAiDeployment(local).deploymentMode,'ON_PREMISE');
 assert.equal(validateCustomerAiDeployment(profile({provider:'AZURE_OPENAI',computeRegion:'EU',storageRegion:'NL',ragRegion:'DE'})).ragRegion,'DE');
 assert.equal(canUseCurrentAiRoute(CURRENT_AI_DEPLOYMENT_PROFILE),true);
 assert.equal(canUseCurrentAiRoute(null),true);
 assert.equal(canUseCurrentAiRoute(local),false);
});

test('offline models cannot silently use external providers or internet',()=>{
 assert.throws(()=>validateCustomerAiDeployment({...local,deploymentMode:'AIR_GAPPED',networkMode:'STANDARD'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.equal(validateCustomerAiDeployment({...local,deploymentMode:'AIR_GAPPED',networkMode:'OFFLINE'}).networkMode,'OFFLINE');
 assert.throws(()=>validateCustomerAiDeployment({...local,provider:'ANTHROPIC'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,allowExternalFallback:true}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,trainingUse:'ALLOWED'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,endpoint:'https://evil.example'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
});

test('unprovisioned preferences fail closed before confidential model invocation',async()=>{
 await assert.rejects(fakeClient({ai_deployment_profile:local}).assertAiAllowed('tenant-a'),e=>e.code==='DATA_SOVEREIGNTY_AI_BLOCKED');
 await assert.rejects(fakeClient({preferred_ai_provider:'openai_eu'}).assertAiAllowed('tenant-a'),e=>e.code==='DATA_SOVEREIGNTY_AI_BLOCKED');
 await assert.rejects(fakeClient({preferred_ai_region:'EU'}).assertAiAllowed('tenant-a'),e=>e.code==='DATA_SOVEREIGNTY_AI_BLOCKED');
 await assert.rejects(fakeClient({ai_deployment_profile:local,enforcement_mode:'OBSERVE'}).assertConnectorAllowed('tenant-a','x'),e=>e.code==='DATA_SOVEREIGNTY_CONNECTOR_BLOCKED');
 await assert.doesNotReject(fakeClient({}).assertAiAllowed('tenant-a'));
});

test('tenant profile persists via Edge and is presented as desired state, not deployed state',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const [api,edge,ui,migration,client]=await Promise.all([
  read('netlify/functions/data-sovereignty.mjs'),read('supabase/functions/portal-state-eu/index.ts'),
  read('portal-next/data-sovereignty-panel.js'),read('supabase/migrations/20261008124500_customer_ai_deployment_profile_v1.sql'),
  read('netlify/functions/_data-sovereignty-client.mjs')
 ]);
 assert.match(api,/resolveIdentityTenant/);
 assert.match(api,/validateCustomerAiDeployment/);
 assert.match(edge,/validAiDeploymentProfile/);
 assert.match(edge,/ai_deployment_profile:aiDeploymentProfile/);
 assert.match(migration,/add column if not exists ai_deployment_profile jsonb/);
 for(const token of ['deploymentMode','modelFamily','computeRegion','storageRegion','ragRegion','networkMode','aiDeploymentProfile','niet geactiveerd'])
  assert.ok(ui.includes(token),token);
 assert.match(client,/canUseCurrentAiRoute/);
 assert.doesNotMatch(ui,/API_KEY|apiKey|secretKey/);
});
