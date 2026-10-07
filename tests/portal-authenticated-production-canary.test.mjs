import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('production canary is OIDC-bound, ephemeral and exercises the real protected Portal API',async()=>{
  const fn=await read('netlify/functions/portal-auth-canary-session.mjs');
  const workflow=await read('.github/workflows/production-release-readback.yml');
  const protectedApi=await read('netlify/functions/portal-ondernemersdata.mjs');

  for(const token of [
    "ISSUER='https://token.actions.githubusercontent.com'",
    "AUDIENCE='bedrijfsgeheugen-portal-production-canary-v1'",
    "REPOSITORY='arthurprinsen-ai/Bedrijfsgeheugen'",
    "OWNER_ID='236997948'",
    "REPOSITORY_ID='1303700955'",
    "REF='refs/heads/main'",
    "WORKFLOW_REF='arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/production-release-readback.yml@refs/heads/main'",
    'subjectMatches(claims.sub)',
    'subject.startsWith(legacyPrefix)',
    'subject.startsWith(immutablePrefix)',
    'OIDC_REPOSITORY_ID_INVALID',
    'OIDC_OWNER_ID_INVALID',
    'repo:arthurprinsen-ai@',
    'webcrypto.subtle.verify',
    'admin.createUser',
    'await login(email,password)',
    'admin.deleteUser',
    'verifyRequestOrigin',
    "path:'/api/internal/portal-auth-canary-session'"
  ]) assert.ok(fn.includes(token),`canary function misses ${token}`);

  assert.ok(workflow.includes('id-token: write'));
  assert.ok(workflow.includes('ACTIONS_ID_TOKEN_REQUEST_URL'));
  assert.ok(workflow.includes('api/internal/portal-auth-canary-session'));
  assert.ok(workflow.includes('api/portal-ondernemersdata'));
  assert.ok(workflow.includes('-c "${cookie_jar}"'));
  assert.ok(workflow.includes('-b "${cookie_jar}"'));
  assert.ok(workflow.includes('http_status}" != "200"'));
  assert.ok(workflow.includes('authenticatedTenant!==expectedTenant'));
  assert.ok(workflow.includes('trap cleanup_canary EXIT'));

  assert.ok(protectedApi.includes("from '@netlify/identity'"));
  assert.ok(protectedApi.includes('getUser(request)'));
  assert.ok(protectedApi.includes("error:'UNAUTHENTICATED'"));
  assert.ok(protectedApi.includes('resolveIdentityTenant(user)'));
  assert.equal(protectedApi.includes('CANARY_OIDC'),false,'protected business API must not gain a canary auth bypass');
});

test('canary stores no static end-user credential or privileged production data secret',async()=>{
  const fn=await read('netlify/functions/portal-auth-canary-session.mjs');
  const workflow=await read('.github/workflows/production-release-readback.yml');
  assert.equal(/PORTAL_.*PASSWORD|CANARY_.*PASSWORD|SUPABASE_SERVICE_ROLE_KEY/.test(workflow),false);
  assert.equal(/password\s*[:=]\s*['"][^'"]+['"]/.test(fn),false);
  assert.ok(fn.includes('randomUUID()'));
  assert.ok(fn.includes("'cache-control':'no-store'"));
});
