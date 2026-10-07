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
