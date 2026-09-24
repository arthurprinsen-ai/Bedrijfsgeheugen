import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
const learning=JSON.parse(fs.readFileSync('brain/learning/netlify-deploy-auth-expiry-20260924-v1.json','utf8'));

test('Netlify fallback auth is reached quickly and classified canonically',()=>{
  assert.match(workflow,/for attempt in \$\(seq 1 3\)/);
  assert.match(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
  assert.equal(learning.compiler.failure_class,'DEPLOY_AUTH_EXPIRED');
  assert.equal(learning.evidence.provider_error,'401 Unauthorized');
  assert.ok(learning.prevention.some(x=>/authentication incident/i.test(x)));
});
