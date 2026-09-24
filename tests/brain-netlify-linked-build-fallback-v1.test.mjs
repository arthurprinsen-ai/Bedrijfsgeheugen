import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../.github/workflows/production-source-snapshot.yml', import.meta.url),'utf8');

test('linked Netlify build failure falls through to the authorized direct MCP fallback',()=>{
  const linkedStart=source.indexOf('if [ "$build_ok" = "true" ] && [ -n "$linked_deploy_id" ]; then');
  const fallback=source.indexOf('npx -y @netlify/mcp@latest --site-id');
  assert.ok(linkedStart>=0);
  assert.ok(fallback>linkedStart);
  const linkedBlock=source.slice(linkedStart,fallback);
  assert.match(linkedBlock,/falling back to direct MCP deploy/);
  assert.doesNotMatch(linkedBlock,/Netlify linked production build failed[^\n]*\n\s*exit 78/);
  assert.doesNotMatch(linkedBlock,/Linked Netlify build did not expose exact SHA[^\n]*\n\s*exit 78/);
});

test('terminal proof remains after transport failover',()=>{
  assert.match(source,/Prove exact production identity/);
  assert.match(source,/NETLIFY_EXACT_PRODUCTION_PROVEN/);
  assert.match(source,/Prove pricing toggles and English switch in production browser/);
});
