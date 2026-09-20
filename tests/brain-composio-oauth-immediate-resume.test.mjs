import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const edge=fs.readFileSync('supabase/functions/powerhouse-composio-instagram-setup/index.ts','utf8');
const admin=fs.readFileSync('netlify/functions/powerhouse-composio-config.mjs','utf8');
const portal=fs.readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');

test('OAuth completion resume is service-auth only and requires exactly one active account',()=>{
  assert.match(edge,/accounts\.length===1/);
  assert.match(edge,/action==='resume'/);
  assert.match(edge,/if\(!serviceOk\)return json\(\{ok:false,error:'ADMIN_SERVICE_AUTH_REQUIRED'\}/);
  assert.match(edge,/powerhouse-social-publisher/);
  assert.match(edge,/trigger:'composio-oauth-complete'/);
});
test('admin bridge exposes resume without exposing scheduler token',()=>{
  assert.match(admin,/create_link','resume/);
  assert.match(admin,/x-bg-service-token/);
  assert.doesNotMatch(admin,/powerhouse_daily_scheduler_token/);
});
test('Control Center polls boundedly and resumes once after ACTIVE',()=>{
  assert.match(portal,/composioPollCount>=60/);
  assert.match(portal,/setTimeout\(async\(\)=>\{/);
  assert.match(portal,/action:'status'/);
  assert.match(portal,/action:'resume'/);
  assert.match(portal,/state\.composio\.resumed/);
  assert.match(portal,/clearTimeout\(composioPollTimer\)/);
  assert.doesNotMatch(portal,/localStorage|sessionStorage/);
});
