import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('linked Netlify build errors fall through to canonical exact-source transport', async () => {
  const workflow = await readFile('.github/workflows/production-source-snapshot.yml', 'utf8');
  assert.match(workflow,/NETLIFY_LINKED_DEPLOY_FAILED deploy=\$linked_deploy_id; continuing with canonical exact-source upload fallback\./);
  assert.match(workflow,/linked_fallback="true"\s*\n\s*break/);
  assert.match(workflow,/npx -y @netlify\/mcp@latest --site-id/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/Netlify production did not expose exact SHA/);
});
