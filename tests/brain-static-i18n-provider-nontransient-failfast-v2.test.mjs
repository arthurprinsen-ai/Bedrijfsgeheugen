import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('static i18n classifies provider credit/auth failures and fails non-transient errors immediately',()=>{
  assert.match(source,/STATIC_I18N_PROVIDER_CREDIT_EXHAUSTED/);
  assert.match(source,/STATIC_I18N_PROVIDER_AUTH_INVALID/);
  assert.match(source,/STATIC_I18N_NON_TRANSIENT_PROVIDER_FAILURE/);
  assert.match(source,/if \(!transient\) \{[\s\S]*throw error;/);
});

test('current deploy transport remains OIDC bridge based and does not revive temporary Netlify secrets',()=>{
  assert.match(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
});
