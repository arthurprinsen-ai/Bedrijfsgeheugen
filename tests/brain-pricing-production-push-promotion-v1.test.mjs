import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production source snapshot deploys and proves exact source on protected main push',()=>{
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  // Deployment applicability (derived once per push) guards the deploy and proof steps.
  const guard=/if: steps\.scope\.outputs\.deployment_required == 'true'/g;
  const matches=workflow.match(guard)||[];
  assert.ok(matches.length >= 4, 'production push must guard auth/deploy/proof steps');
  assert.match(workflow,/Deploy exact source through authorized Netlify transport/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
  assert.match(workflow,/NETLIFY_PRODUCTION_PROVEN/);
  assert.match(workflow,/Install production interaction browser/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
