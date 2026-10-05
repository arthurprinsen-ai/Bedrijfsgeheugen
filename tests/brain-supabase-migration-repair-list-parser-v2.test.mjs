import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

test('trusted repair normalizes Supabase CLI presentation backticks before migration identity comparison', () => {
  const normalizers = workflow.match(/replace\(\/\^\\`\|\\`\$\/g,''\)/g) || [];
  assert.equal(normalizers.length, 2, 'both pre-repair and post-repair parsers must normalize backticks');
  assert.match(workflow, /UNEXPECTED_PRE_REPAIR_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
  assert.match(workflow, /20260920101150/);
  assert.match(workflow, /20260920102450/);
  assert.match(workflow, /20260925080500/);
  assert.match(workflow, /20261005133951/);
  assert.match(workflow, /supabase migration repair[\s\S]*--status applied/);
});
