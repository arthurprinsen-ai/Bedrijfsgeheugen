import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync('supabase/functions/powerhouse-meta-instagram-setup/index.ts','utf8');
const config=fs.readFileSync('netlify/functions/powerhouse-meta-instagram-config.mjs','utf8');
const callback=fs.readFileSync('netlify/functions/powerhouse-meta-instagram-oauth-callback.mjs','utf8');
const refresh=fs.readFileSync('netlify/functions/meta-instagram-token-refresh.mjs','utf8');
const page=fs.readFileSync('portal-v2/powerhouse-instagram-connect.html','utf8');
const migration=fs.readFileSync('supabase/migrations/20260921152000_instagram_meta_oauth_onboarding_v1.sql','utf8');

test('Instagram OAuth onboarding is admin initiated and CSRF state is signed',()=>{
  assert.match(config,/getUser/);
  assert.match(config,/isPowerhouseAdmin/);
  assert.match(config,/HMAC/);
  assert.match(config,/instagram_business_basic,instagram_business_content_publish/);
  assert.match(callback,/safeEq/);
  assert.match(callback,/EXPIRED_OAUTH_STATE/);
});

test('OAuth exchanges short token for long-lived token and stores only server side',()=>{
  assert.match(edge,/api\.instagram\.com\/oauth\/access_token/);
  assert.match(edge,/ig_exchange_token/);
  assert.match(edge,/powerhouse_set_meta_instagram_credentials_v1/);
  assert.match(edge,/bg_geheim/);
  assert.match(edge,/fields=user_id,username/);
  assert.doesNotMatch(page,/localStorage|sessionStorage/);
  assert.doesNotMatch(page,/META_INSTAGRAM_ACCESS_TOKEN|IGAA|access_token=/);
});

test('Meta app secret writer is service-role only',()=>{
  assert.match(migration,/META_INSTAGRAM_APP_SECRET/);
  assert.match(migration,/revoke execute .* from public, anon, authenticated/i);
  assert.match(migration,/grant execute .* to service_role/i);
});

test('long-lived Instagram token is refreshed automatically',()=>{
  assert.match(edge,/ig_refresh_token/);
  assert.match(refresh,/refresh_token/);
  assert.match(refresh,/schedule:'17 4 \* \* \*'/);
});

test('connect page uses exact production callback and never exposes secrets in URL',()=>{
  assert.match(page,/https:\/\/www\.bedrijfsgeheugen\.nl\/api\/powerhouse-meta-instagram-oauth-callback/);
  assert.match(page,/type="password"/);
  assert.doesNotMatch(callback,/app_secret=.*searchParams/);
});
