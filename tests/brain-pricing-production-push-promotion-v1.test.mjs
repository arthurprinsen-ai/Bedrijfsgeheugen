import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production source snapshot deploys and proves exact source on protected main push',()=>{
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  const pushGuard=/\(github\.event_name == 'workflow_dispatch' && inputs\.deploy == true\) \|\| github\.event_name == 'push'/g;
  const matches=workflow.match(pushGuard)||[];
  assert.ok(matches.length >= 3, 'production push must guard deploy/proof steps');
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH_TEMP/);
  assert.match(workflow,/NETLIFY_EXACT_PRODUCTION_PROVEN/);
  assert.match(workflow,/Install production interaction browser/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
