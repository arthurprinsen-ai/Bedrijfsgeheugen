import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production snapshot prefers durable Netlify token transport before MCP proxy fallback',()=>{
  assert.match(workflow,/NETLIFY_AUTH_TOKEN: \$\{\{ secrets\.NETLIFY_AUTH_TOKEN \}\}/);
  assert.match(workflow,/netlify-cli@latest deploy --build --prod --site fd527056-493a-4d8a-8125-d00370104fa3 --auth "\$NETLIFY_AUTH_TOKEN"/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH_TEMP/);
  assert.match(workflow,/No authorized Netlify production transport is available/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
