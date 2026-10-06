import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-supported-migration-repair-3742.yml', import.meta.url), 'utf8');

function normalizeCell(value) {
  return value.trim().replace(/^`|`$/g,'').trim();
}

test('empty remote Supabase CLI cell normalizes to truly empty', () => {
  assert.equal(normalizeCell('` `'), '');
  assert.equal(normalizeCell('`20260920101150`'), '20260920101150');
});

test('trusted repair normalizes both pre- and post-repair cells after stripping backticks', () => {
  const needle = "x=>x.trim().replace(/^\\`|\\`$/g,'').trim()";
  assert.equal(workflow.split(needle).length - 1, 2);
  assert.match(workflow, /REMOTE_ONLY_OR_IDENTITY_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
});
