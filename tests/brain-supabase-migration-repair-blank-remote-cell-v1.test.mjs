import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

test('trusted repair normalizes blank backtick-wrapped remote cells to empty', () => {
  const normalizers = workflow.match(/replace\(\/\^\\`\+\|\\`\+\$\/g,''\)\.trim\(\)/g) || [];
  assert.equal(normalizers.length, 2, 'pre- and post-repair parsers must trim after backtick removal');
  const normalize = value => value.trim().replace(/^`+|`+$/g,'').trim();
  assert.equal(normalize('` `'), '');
  assert.equal(normalize('`20260920101150`'), '20260920101150');
  assert.match(workflow, /REMOTE_ONLY_OR_IDENTITY_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
});
