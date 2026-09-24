import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('Netlify production transport waits for terminal provider result before SHA proof',()=>{
  assert.match(workflow,/npx -y @netlify\/mcp@latest --site-id fd527056-493a-4d8a-8125-d00370104fa3 --proxy-path "\$NETLIFY_MCP_PROXY_PATH"/);
  assert.doesNotMatch(workflow,/@netlify\/mcp@latest[^\n]*--no-wait/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/NETLIFY_EXACT_PRODUCTION_PROVEN/);
});
