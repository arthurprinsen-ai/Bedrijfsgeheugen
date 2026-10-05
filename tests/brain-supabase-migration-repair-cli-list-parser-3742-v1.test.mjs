import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

test('historical repair parser accepts CLI-rendered backtick version cells without weakening identity proof', () => {
  const marker = "replace(/^\`+|\`+$/g,'')";
  assert.equal(workflow.split(marker).length - 1, 2);
  assert.match(workflow, /const expected=\['20260920101150','20260920102450','20260925080500','20261005133951'\]/);
  assert.match(workflow, /UNEXPECTED_PRE_REPAIR_DRIFT/);
  assert.match(workflow, /REMOTE_ONLY_OR_IDENTITY_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
  assert.match(workflow, /supabase migration repair[\s\S]*--status applied --db-url/);
  assert.doesNotMatch(workflow, /(?:insert|update|delete)\s+(?:into\s+|from\s+)?supabase_migrations/i);
});
