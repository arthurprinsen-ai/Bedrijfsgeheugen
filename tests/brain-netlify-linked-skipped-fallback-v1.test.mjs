import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('linked Netlify Skipped state falls through to canonical exact-source transport', async()=>{
  const workflow=await readFile('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/error_message=.*error_message/);
  assert.match(workflow,/\[ "\$error_message" = "Skipped" \]/);
  assert.match(workflow,/NETLIFY_LINKED_DEPLOY_SKIPPED/);
  assert.match(workflow,/linked_fallback="true"/);
  assert.match(workflow,/continuing with canonical exact-source upload fallback/);
  assert.match(workflow,/npx -y @netlify\/mcp@latest/);
});
