import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('native Git primary removes the redundant linked-build skipped-state branch', async()=>{
  const workflow=await readFile('.github/workflows/production-source-snapshot.yml','utf8');
  assert.doesNotMatch(workflow,/NETLIFY_LINKED_DEPLOY_SKIPPED/);
  assert.doesNotMatch(workflow,/linked_fallback=/);
  assert.doesNotMatch(workflow,/action:"trigger_build"/);
  assert.match(workflow,/NETLIFY_NATIVE_GIT_PRIMARY_WAIT/);
  assert.match(workflow,/NETLIFY_JIT_FALLBACK_UNAVAILABLE/);
  assert.match(workflow,/npx -y @netlify\/mcp@latest/);
});
