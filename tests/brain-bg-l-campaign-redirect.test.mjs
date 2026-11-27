import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const code = readFileSync('supabase/functions/bg-l/index.ts', 'utf8');

test('company tracking codes resolve against the campaign registry', () => {
  assert.match(code, /from\('bg_campaign_links'\)/);
  assert.match(code, /\.eq\('key', sleutel\)\.maybeSingle\(\)/);
  assert.match(code, /if \(campagne\)/);
  assert.match(code, /status: 302/);
});

test('campaign redirects reject revoked or expired codes and foreign destinations', () => {
  assert.match(code, /campagne\.status !== 'active'/);
  assert.match(code, /campagne\.expires_at/);
  assert.match(code, /bestemming\.protocol !== 'https:'/);
  assert.match(code, /'www\.bedrijfsgeheugen\.nl'/);
  assert.match(code, /bestemming\.username \|\| bestemming\.password/);
});

test('existing personal-link attribution remains separately supported', () => {
  assert.match(code, /from\('bg_connecties'\)/);
  assert.match(code, /rpc\('bg_klik_vastleggen'/);
  assert.match(code, /SLEUTEL_NIET_GEVONDEN/);
});

test('company campaigns retain attribution and do not request personal identity', () => {
  assert.match(code, /utm_source/);
  assert.match(code, /utm_medium/);
  assert.match(code, /utm_campaign/);
  assert.match(code, /utm_content/);
  assert.match(code, /'no-store, max-age=0'/);
});
