import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('data sovereignty API is tenant-bound and Supabase Edge calls are pinned to Frankfurt',async()=>{
 const api=await read('netlify/functions/data-sovereignty.mjs');
 assert.match(api,/resolveIdentityTenant/);
 assert.match(api,/scope.*bedrijfsgeheugen/);
 assert.doesNotMatch(api,/region\s*:\s*['"]fra['"]/);
 const client=await read('netlify/functions/_data-sovereignty-client.mjs');
 assert.match(client,/x-region.*eu-central-1/);
 assert.match(client,/DATA_SOVEREIGNTY_AI_BLOCKED/);
 assert.match(client,/DATA_SOVEREIGNTY_CONNECTOR_BLOCKED/);
});

test('Netlify compute and Blob storage are never presented as EU-pinned without evidence',async()=>{
 const proof=await read('netlify/functions/data-sovereignty-runtime-proof.mjs');
 assert.match(proof,/euOnlyGuarantee:false/);
 assert.match(proof,/PLATFORM_MANAGED_UNKNOWN/);
 assert.doesNotMatch(proof,/region\s*:\s*['"]fra['"]/);
 const correction=await read('supabase/migrations/20261007111230_correct_netlify_sovereignty_truth_v1.sql');
 for(const token of ['PLATFORM_ROUTED_UNPINNED','PLATFORM_MANAGED_UNKNOWN_REGION','POSSIBLE_OUTSIDE_EEA','OBSERVATION_ONLY'])assert.match(correction,new RegExp(token));
});

test('customer-facing Netlify functions do not claim an unsupported per-function region',async()=>{
 for(const p of ['portal-state.mjs','portal-business-input.mjs','portal-project.mjs','portal-connectors.mjs','portaalvraag.mjs','connector-ai-guide.mjs','i18n-translate.mjs','data-sovereignty.mjs']){
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

test('runtime observation is heartbeat wired but does not stop the Powerhouse heartbeat when Netlify is not EU-proven',async()=>{
 const proof=await read('netlify/functions/data-sovereignty-runtime-proof.mjs');
 assert.match(proof,/runtimeRegion/);
 assert.match(proof,/euOnlyGuarantee:false/);
 const hb=await read('netlify/functions/powerhouse-commercial-heartbeat-background.mjs');
 assert.match(hb,/observeDataSovereignty/);
 assert.match(hb,/data_sovereignty_provider_observe/);
 assert.match(hb,/OBSERVATION_UNAVAILABLE/);
 assert.doesNotMatch(hb,/SOVEREIGNTY_RUNTIME_PROOF_FAILED/);
 const edge=await read('supabase/functions/portal-state-eu/index.ts');
 assert.match(edge,/record_data_sovereignty_provider_observation_v1/);
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

test('connector activation is blocked before state becomes Active when sovereignty evidence fails',async()=>{
 const fn=await read('netlify/functions/portal-connectors.mjs');
 const handler=await read('platform/api/portal-connectors-handler.mjs');
 assert.match(fn,/createDataSovereigntyClient/);
 assert.match(fn,/sovereignty/);
 assert.match(handler,/assertConnectorAllowed/);
 assert.match(handler,/DATA_SOVEREIGNTY_CONNECTOR_BLOCKED/);
 const guardIndex=handler.indexOf('assertConnectorAllowed');
 const activeIndex=handler.indexOf("state:'Active'");
 assert.ok(guardIndex>=0&&activeIndex>guardIndex);
});

test('sovereignty files contain no interruption escape artifacts',async()=>{
 for(const p of ['portal-next/compliance.html','netlify/functions/i18n-translate.mjs','supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts']){
   const src=await read(p);
   assert.doesNotMatch(src,/\\\\n(?:import|\s*<|\s*data_sovereignty)/,p);
 }
});
