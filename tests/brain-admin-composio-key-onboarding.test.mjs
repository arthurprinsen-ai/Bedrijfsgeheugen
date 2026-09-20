import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const edge=fs.readFileSync('supabase/functions/powerhouse-composio-instagram-setup/index.ts','utf8');
const netlify=fs.readFileSync('netlify/functions/powerhouse-composio-config.mjs','utf8');
const migration=fs.readFileSync('supabase/migrations/20260920111000_admin_composio_key_onboarding.sql','utf8');
const portal=fs.readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');

test('admin onboarding keeps browser behind Netlify Identity and server token',()=>{
  assert.match(netlify,/getUser/);
  assert.match(netlify,/isPowerhouseAdmin/);
  assert.match(netlify,/POWERHOUSE_ADMIN_EMAILS/);
  assert.match(netlify,/x-bg-service-token/);
  assert.doesNotMatch(netlify,/localStorage|sessionStorage/);
});
test('Supabase key write is narrow and service-role only',()=>{
  assert.match(migration,/powerhouse_set_composio_api_key_v1/);
  assert.match(migration,/COMPOSIO_API_KEY/);
  assert.match(migration,/revoke all .* from public,anon,authenticated/i);
  assert.match(migration,/grant execute .* to service_role/i);
});
test('key is provider-validated before canonical storage',()=>{
  const validate=edge.indexOf("await api(candidate,'/auth_configs?limit=1')");
  const store=edge.indexOf("powerhouse_set_composio_api_key_v1");
  assert.ok(validate>=0&&store>validate);
  assert.match(edge,/set_api_key/);
  assert.match(edge,/x-bg-service-token/);
});

test('Control Center exposes safe one-time onboarding without browser persistence',()=>{
  assert.match(portal,/\['integrations','Koppelingen'\]/);
  assert.match(portal,/type="password"/);
  assert.match(portal,/\/api\/powerhouse-composio-config/);
  assert.match(portal,/data-composio-link/);
  assert.doesNotMatch(portal,/localStorage|sessionStorage/);
  assert.doesNotMatch(portal,/state\.composio[^\n]*apiKey/);
});
