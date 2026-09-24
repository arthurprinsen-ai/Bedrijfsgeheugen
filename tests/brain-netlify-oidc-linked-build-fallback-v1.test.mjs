import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production snapshot orders Git, OIDC linked build, then MCP fallback',()=>{
  const git=workflow.indexOf('Exact SHA is already live via Git-linked Netlify deploy');
  const linked=workflow.indexOf('NETLIFY_LINKED_BUILD_TRIGGER');
  const linkedSuccess=workflow.indexOf('Exact SHA reached production through linked-repository Netlify build');
  const mcp=workflow.indexOf('npx -y @netlify/mcp@latest');
  assert.ok(git >= 0);
  assert.ok(linked > git);
  assert.ok(linkedSuccess > linked);
  assert.ok(mcp > linkedSuccess);
  assert.match(workflow,/action:"trigger_build"/);
  assert.match(workflow,/branch=main/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
