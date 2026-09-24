import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production snapshot fails fast on Netlify provider build error',()=>{
  assert.match(workflow,/NETLIFY_DEPLOY_ID/);
  assert.match(workflow,/NETLIFY_BUILD_ID/);
  assert.match(workflow,/Fail fast on Netlify provider build error/);
  assert.match(workflow,/api\/v1\/deploys\/\$NETLIFY_DEPLOY_ID/);
  assert.match(workflow,/api\/v1\/builds\/\$NETLIFY_BUILD_ID/);
  assert.match(workflow,/NETLIFY_PROVIDER_DEPLOY_ERROR/);
  assert.match(workflow,/NETLIFY_PROVIDER_BUILD_ERROR/);
  assert.match(workflow,/if \[ "\$state" = "error" \]/);
  assert.match(workflow,/Prove exact production identity/);
});
