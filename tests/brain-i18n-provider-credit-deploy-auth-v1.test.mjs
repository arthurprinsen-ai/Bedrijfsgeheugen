import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const i18n=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
const continuity=fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
const delivery=fs.readFileSync('.agents/skills/powerhouse-delivery-concurrency/SKILL.md','utf8');

test('static English build classifies exhausted credits and does not retry non-transient provider failures',()=>{
  assert.match(i18n,/STATIC_I18N_PROVIDER_CREDIT_EXHAUSTED/);
  assert.match(i18n,/STATIC_I18N_PROVIDER_AUTH_INVALID/);
  assert.match(i18n,/STATIC_I18N_NON_TRANSIENT_PROVIDER_FAILURE/);
  assert.match(i18n,/if \(!transient\) \{[\s\S]*throw error/);
});

test('production deploy prefers a durable Netlify credential over ephemeral MCP proxy',()=>{
  assert.match(workflow,/NETLIFY_AUTH_TOKEN: \$\{\{ secrets\.NETLIFY_AUTH_TOKEN \}\}/);
  assert.match(workflow,/NETLIFY_DURABLE_DEPLOY_CREDENTIAL_MISSING/);
  assert.match(workflow,/NETLIFY_EPHEMERAL_PROXY_EXPIRED/);
  assert.match(workflow,/netlify-cli@latest deploy --build --prod/);
});

test('skills encode provider-credit and ephemeral deploy-auth prevention',()=>{
  for(const source of [continuity,delivery]){
    assert.match(source,/provider-credit-deploy-auth-preflight-20260924-v1/);
    assert.match(source,/credit/i);
    assert.match(source,/ephemeral/i);
    assert.match(source,/durable/i);
  }
});
