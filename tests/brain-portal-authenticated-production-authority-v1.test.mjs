import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const mode=String(process.env.POWERHOUSE_LEARNING_EVAL_MODE||'HISTORICAL_REPLAY').toUpperCase();

test('Portal authenticated production authority stays split across Identity, EU gateway and Supabase privileged runtime',async()=>{
  assert.ok(['HISTORICAL_REPLAY','SHADOW','CANARY'].includes(mode),`unsupported learning eval mode: ${mode}`);

  const [api,store,edge,readback]=await Promise.all([
    readFile(new URL('../netlify/functions/portal-ondernemersdata.mjs',import.meta.url),'utf8'),
    readFile(new URL('../netlify/functions/_portal-supabase-store.mjs',import.meta.url),'utf8'),
    readFile(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8'),
    readFile(new URL('../.github/workflows/production-release-readback.yml',import.meta.url),'utf8'),
  ]);

  assert.match(api,/getUser/);
  assert.match(api,/resolveIdentityTenant/);
  assert.match(api,/getEntrepreneurIntelligence\(tenantId\)/);
  assert.doesNotMatch(api,/SUPABASE_(?:SERVICE_ROLE_KEY|SERVICE_KEY|SECRET_KEY)/);
  assert.doesNotMatch(api,/\/rest\/v1\//);
  assert.doesNotMatch(api,/Netlify\.env/);

  assert.match(store,/BG_PORTAL_EU_SUPABASE_URL/);
  assert.match(store,/BG_PORTAL_EU_SERVICE_TOKEN/);
  assert.match(store,/action:'entrepreneur_intelligence'/);
  assert.match(store,/authenticatedTenant/);
  assert.match(store,/tenant scope mismatch/i);

  assert.match(edge,/if\(action==='entrepreneur_intelligence'\)/);
  assert.match(edge,/Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);
  assert.match(edge,/x-bg-service-token/);
  assert.match(edge,/powerhouse_intelligence_company_impact_v1/);

  assert.match(readback,/PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1/);
  assert.match(readback,/proof\?\.http_status!==200/);
  assert.match(readback,/tenant_scope_verified/);
  assert.match(readback,/payload_shape_verified/);
  assert.match(readback,/synthetic_user_cleanup/);
});
