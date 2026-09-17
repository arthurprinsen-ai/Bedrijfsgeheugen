import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/required-test.yml', import.meta.url);

async function workflow() {
  return readFile(workflowPath, 'utf8');
}

test('required test keeps one valid protected aggregator and gates preflight on hygiene', async () => {
  const source = await workflow();
  assert.doesNotMatch(source, /^auto_cancel:\s*/m, 'auto_cancel is not a valid top-level GitHub Actions workflow key');
  assert.match(source, /jobs:\s*\n\s+hygiene:\s*\n\s+uses:\s+\.\/\.github\/workflows\/powerhouse-delivery-hygiene\.yml/m);
  assert.match(source, /preflight:\s*\n\s+needs:\s+hygiene\s*\n\s+if:\s+needs\.hygiene\.outputs\.admitted == 'true'/m);
  assert.match(source, /test:\s*\n\s+name:\s+test\s*\n[\s\S]*?needs:\s*\[hygiene, preflight, backend, portal, automation, website\]/m);
});
