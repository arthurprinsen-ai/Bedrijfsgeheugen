import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const edge=fs.readFileSync('supabase/functions/powerhouse-meta-instagram-setup/index.ts','utf8');
const netlify=fs.readFileSync('netlify/functions/powerhouse-meta-instagram-config.mjs','utf8');
const migration=fs.readFileSync('supabase/migrations/20260921121500_meta_instagram_direct_credentials.sql','utf8');

test('direct Meta credentials are admin-only and never browser-persisted',()=>{
  assert.match(netlify,/getUser/);assert.match(netlify,/isPowerhouseAdmin/);assert.match(netlify,/x-bg-service-token/);
  assert.doesNotMatch(netlify,/localStorage|sessionStorage/);
  assert.match(edge,/META_INSTAGRAM_ACCESS_TOKEN/);assert.match(edge,/graph\.instagram\.com/);
});
test('credentials are validated before vault storage',()=>{
  const setStart=edge.indexOf("if(action==='set_credentials')");
  const validate=edge.indexOf('await validateMeta(candidateToken',setStart);
  const store=edge.indexOf('await storeRuntimeCredentials(db,candidateToken',setStart);
  assert.ok(setStart>=0&&validate>setStart&&store>validate);
  assert.match(edge,/async function storeRuntimeCredentials/);
  assert.match(edge,/powerhouse_set_meta_instagram_credentials_v1/);
});
test('vault writer is service role only',()=>{
  assert.match(migration,/revoke execute .* from public, anon, authenticated/i);
  assert.match(migration,/grant execute .* to service_role/i);
});
