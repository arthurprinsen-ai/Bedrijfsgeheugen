import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('linked Netlify build error reaches canonical exact-source fallback', async () => {
  const source = await readFile('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(source,/NETLIFY_LINKED_DEPLOY_FAILED deploy=\$linked_deploy_id; continuing with canonical exact-source upload fallback\./);
  assert.match(source,/linked_fallback="true"\s*\n\s*break/);
  assert.match(source,/npx -y @netlify\/mcp@latest --site-id/);
  assert.match(source,/NETLIFY_PROVIDER_BUILD_READY/);
  assert.match(source,/NETLIFY_EXACT_PRODUCTION_PROVEN/);
});
