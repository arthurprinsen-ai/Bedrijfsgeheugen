import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('existing tenant-bound entrepreneur endpoint has bounded fetch and no retry storm',()=>{
 const store=get('netlify/functions/_portal-supabase-store.mjs');
 const route=get('netlify/functions/portal-ondernemersdata.mjs');
 assert.match(store,/entrepreneurTimeoutMs=23000/);
 assert.match(store,/controller\.abort\(\)/);
 assert.match(store,/Promise\.race\(\[run\(\),deadline\]\)/);
 assert.match(store,/tenant scope mismatch/);
 assert.match(route,/PORTAL_INTELLIGENCE_UPSTREAM_TIMEOUT/);
 assert.doesNotMatch(route,/setInterval|while\s*\(/);
});
test('upstream 401, 403, 502 and 503 response bodies cannot be cached as successful tenant data',()=>{
 const route=get('netlify/functions/portal-ondernemersdata.mjs');
 assert.match(route,/status>=400\?'no-store'/);
 assert.match(route,/status===503\?\{'retry-after':'20'\}/);
 assert.match(route,/vary':'authorization, cookie'/);
 assert.match(route,/if\(!user\?\.id\)/);
 assert.match(route,/resolveIdentityTenant/);
});

test('operator gateway failure category is safe, finite and does not expose customer identity or upstream bodies',()=>{
 const route=get('netlify/functions/portal-ondernemersdata.mjs');
 const store=get('netlify/functions/_portal-supabase-store.mjs');
 for(const code of ['CONFIG_MISSING','UPSTREAM_DEADLINE','TENANT_SCOPE_MISMATCH','UPSTREAM_RESPONSE_SHAPE','UPSTREAM_NETWORK_FETCH','UPSTREAM_UNKNOWN_FAILURE','UPSTREAM_HTTP_'])assert.ok(route.includes(code),code);
 assert.match(route,/PORTAL_ENTREPRENEUR_GATEWAY_FAILED category=/);
 assert.doesNotMatch(route,/console\.error\([^\n]*(?:tenantId|token|message|JSON\.stringify)/);
 assert.match(store,/response shape invalid/);
 assert.match(route,/ENTREPRENEUR_INTELLIGENCE_GATEWAY_FAILED/);
 assert.match(route,/status>=400\?'no-store'/);
});
