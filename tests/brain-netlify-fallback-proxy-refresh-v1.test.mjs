import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('fallback upload refreshes short-lived Netlify proxy immediately before MCP deploy', () => {
  const deployIndex = workflow.indexOf('npx -y @netlify/mcp@latest');
  const refreshIndex = workflow.lastIndexOf('fresh_proxy=', deployIndex);
  const oidcIndex = workflow.lastIndexOf('ACTIONS_ID_TOKEN_REQUEST_URL', refreshIndex);
  const bridgeIndex = workflow.lastIndexOf('netlify-deploy-bridge', refreshIndex);
  assert.ok(deployIndex > 0, 'Netlify MCP deploy command missing');
  assert.ok(oidcIndex > 0 && oidcIndex < refreshIndex, 'OIDC refresh must precede fresh proxy extraction');
  assert.ok(bridgeIndex > 0 && bridgeIndex < refreshIndex, 'deploy bridge call must precede fresh proxy extraction');
  assert.ok(refreshIndex > 0 && refreshIndex < deployIndex, 'fresh proxy refresh must precede fallback deploy');
  assert.match(workflow.slice(refreshIndex, deployIndex), /NETLIFY_MCP_PROXY_PATH="\$fresh_proxy"/);
});
