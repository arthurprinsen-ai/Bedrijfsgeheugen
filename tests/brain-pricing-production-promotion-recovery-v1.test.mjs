import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production snapshot workflow keeps exact-source deployment and proof',()=>{
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.match(workflow,/Deploy exact source through authorized Netlify transport/);
  assert.match(workflow,/ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/NETLIFY_EXACT_PRODUCTION_PROVEN/);
  const learning=JSON.parse(fs.readFileSync('brain/learning/pricing-production-promotion-2026-09-22-v1.json','utf8'));
  assert.equal(learning.fingerprint,'pricing-production-promotion-2026-09-22-v1');
  assert.ok(learning.root_cause);
  assert.ok(learning.prevention_rule);
});
