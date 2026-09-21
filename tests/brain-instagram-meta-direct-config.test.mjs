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
  const validate=edge.indexOf('await validateMeta(candidateToken');
  const store=edge.indexOf('powerhouse_set_meta_instagram_credentials_v1');
  assert.ok(validate>=0&&store>validate);
});
test('vault writer is service role only',()=>{
  assert.match(migration,/revoke execute .* from public, anon, authenticated/i);
  assert.match(migration,/grant execute .* to service_role/i);
});
