import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('data sovereignty API is tenant-bound, EU pinned and exposes self read-only scope',async()=>{
 const api=await read('netlify/functions/data-sovereignty.mjs');
 assert.match(api,/resolveIdentityTenant/);assert.match(api,/scope.*bedrijfsgeheugen/);assert.match(api,/region:'fra'/);
 const client=await read('netlify/functions/_data-sovereignty-client.mjs');
 assert.match(client,/x-region.*eu-central-1/);assert.match(client,/DATA_SOVEREIGNTY_AI_BLOCKED/);
});
test('customer portal fallback blobs are explicitly stored in Frankfurt',async()=>{
 const store=await read('netlify/functions/_portal-read-model-store.mjs');
 assert.match(store,/region:\s*'eu-central-1'/);
});
test('customer-facing portal functions are pinned to Frankfurt',async()=>{
 for(const p of ['portal-state.mjs','portal-business-input.mjs','portal-project.mjs','portal-connectors.mjs','portaalvraag.mjs','connector-ai-guide.mjs','i18n-translate.mjs']){
  const src=await read('netlify/functions/'+p);assert.match(src,/region:\s*'fra'/,p);
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
 assert.match(edge,/data_sovereignty_policy_set/);assert.match(edge,/EU_ONLY/);assert.match(edge,/enforcement_mode/);
 const hb=await read('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts');
 assert.match(hb,/powerhouse_refresh_data_sovereignty_v1/);
});


test('runtime proof is heartbeat wired and region-evidence backed',async()=>{
 const proof=await read('netlify/functions/data-sovereignty-runtime-proof.mjs');
 assert.match(proof,/runtimeRegion/);assert.match(proof,/configuredStorageRegion:'eu-central-1'/);assert.match(proof,/region:'fra'/);
 const hb=await read('netlify/functions/powerhouse-commercial-heartbeat-background.mjs');
 assert.match(hb,/data-sovereignty\/runtime-proof/);assert.match(hb,/data_sovereignty_provider_observe/);assert.match(hb,/SOVEREIGNTY_RUNTIME_PROOF_FAILED/);
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
 assert.match(brain,/assertTenantAiAllowed/);assert.match(brain,/DATA_SOVEREIGNTY_TENANT_REQUIRED/);
 assert.match(connector,/assertAiAllowed/);assert.match(question,/DATA_SOVEREIGNTY_AI_BLOCKED/);
});

test('sovereignty files contain no interruption escape artifacts',async()=>{
 for(const p of ['portal-next/compliance.html','netlify/functions/i18n-translate.mjs','supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts']){
   const src=await read(p);
   assert.doesNotMatch(src,/\\\\n(?:import|\s*<|\s*data_sovereignty)/,p);
 }
});
