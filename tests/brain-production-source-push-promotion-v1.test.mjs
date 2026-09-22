import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production source snapshot push performs authorized exact-source deploy and proof', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow,/paths:\s*\n\s*- '\.github\/workflows\/production-source-snapshot\.yml'/);
  const condition="if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.deploy == true)";
  assert.equal(workflow.split(condition).length-1,2,'deploy and proof must both run for main push');
  assert.match(workflow,/Deploy exact source through authorized Netlify transport/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH_TEMP/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/NETLIFY_EXACT_PRODUCTION_PROVEN/);
});
