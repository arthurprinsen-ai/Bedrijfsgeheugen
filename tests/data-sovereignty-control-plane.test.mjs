import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('data sovereignty API is tenant-bound and Supabase Edge calls are pinned to Frankfurt',async()=>{
 const api=await read('netlify/functions/data-sovereignty.mjs');
 assert.match(api,/resolveIdentityTenant/);
 assert.match(api,/scope.*bedrijfsgeheugen/);
 const client=await read('netlify/functions/_data-sovereignty-client.mjs');
 assert.match(client,/x-region.*eu-central-1/);
 assert.match(client,/DATA_SOVEREIGNTY_AI_BLOCKED/);
 assert.match(client,/DATA_SOVEREIGNTY_CONNECTOR_BLOCKED/);
});

test('Netlify customer-data functions are pinned canonically in netlify.toml',async()=>{
 const toml=await read('netlify.toml');
 for(const name of ['portal-state','portal-business-input','portal-project','portal-connectors','portaalvraag','connector-ai-guide','document-extractor','i18n-translate','portal-entitlements','portal-feedback','portal-ondernemersdata','portal-prediction-intelligence','portal-scans','data-sovereignty','data-sovereignty-runtime-proof','powerhouse-commercial-heartbeat-background','powerhouse-commercial-heartbeat-schedule']){
   const pattern='\\[functions\\."'+name+'"\\]\\s*\\n\\s*region = "fra"';
   assert.match(toml,new RegExp(pattern),name);
 }
});

test('site-wide portal Blob stores explicitly use Frankfurt while legacy residency remains fail-closed',async()=>{
 const projection=await read('netlify/functions/_portal-read-model-store.mjs');
 const feedback=await read('netlify/functions/portal-feedback.mjs');
 assert.match(projection,/region:\s*'eu-central-1'/);
 assert.match(feedback,/region:\s*'eu-central-1'/);
 const correction=await read('supabase/migrations/20261007111513_netlify_sovereignty_truth_hardening_v1.sql');
 assert.match(correction,/EU_FRANKFURT_NEW_WRITES_LEGACY_UNVERIFIED/);
 assert.match(correction,/MIGRATED_AND_PURGED/);
 assert.match(correction,/evidence_status=case/);
});

test('runtime proof uses measured Netlify server region and never turns legacy storage green by configuration alone',async()=>{
 const proof=await read('netlify/functions/data-sovereignty-runtime-proof.mjs');
 assert.match(proof,/context\?\.server\?\.region/);
 assert.match(proof,/computeRegionVerified/);
 assert.match(proof,/blobRegionTarget:'eu-central-1'/);
 assert.match(proof,/legacyStorageState:'UNVERIFIED_MIGRATION_REQUIRED'/);
 assert.match(proof,/verified:false/);
 const hb=await read('netlify/functions/powerhouse-commercial-heartbeat-background.mjs');
 assert.match(hb,/observeDataSovereignty/);
 assert.match(hb,/data_sovereignty_provider_observe/);
 assert.match(hb,/legacyStorageState/);
 assert.doesNotMatch(hb,/SOVEREIGNTY_RUNTIME_PROOF_FAILED/);
});

test('customer-facing functions do not carry conflicting inline fra config',async()=>{
 for(const p of ['portal-state.mjs','portal-business-input.mjs','portal-project.mjs','portal-connectors.mjs','portaalvraag.mjs','connector-ai-guide.mjs','i18n-translate.mjs','data-sovereignty.mjs','portal-feedback.mjs']){
  const src=await read('netlify/functions/'+p);
  assert.doesNotMatch(src,/region\s*:\s*['"]fra['"]/,p);
 }
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
 const firstGuard=handler.indexOf('assertConnectorAllowed');
 const runTest=handler.indexOf('engine.runTest');
 const secondGuard=handler.indexOf('assertConnectorAllowed',firstGuard+1);
 const active=handler.indexOf("state:'Active'");
 assert.ok(firstGuard>=0&&runTest>firstGuard,'test guard must run before engine.runTest');
 assert.ok(secondGuard>runTest&&active>secondGuard,'activation guard must run before Active state');
});

test('sovereignty files contain no interruption escape artifacts',async()=>{
 for(const p of ['portal-next/compliance.html','netlify/functions/i18n-translate.mjs','netlify/functions/portaalvraag.mjs','netlify/functions/connector-ai-guide.mjs','supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts']){
   const src=await read(p);
   assert.doesNotMatch(src,/\\\\n(?:import|\s*<|\s*const|\s*data_sovereignty)/,p);
 }
});
