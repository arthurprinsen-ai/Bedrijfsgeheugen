import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

function parseMigrationList(text) {
  return text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean)
    .map(line=>line.split(/[|│]/).map(x=>x.trim().replace(/^`|`$/g,'').trim()))
    .filter(x=>x.length>=2 && (/^\d{14}$/.test(x[0]) || /^\d{14}$/.test(x[1])))
    .map(x=>({local:x[0]||'',remote:x[1]||''}));
}

test('trusted repair treats Supabase CLI blank remote cells rendered as backtick-space-backtick as empty', () => {
  const sample = [
    '`20260920101150` | ` ` | `2026-09-20 10:11:50`',
    '`20260920102450` | ` ` | `2026-09-20 10:24:50`',
    '`20260925080500` | ` ` | `2026-09-25 08:05:00`',
    '`20261005133951` | ` ` | `2026-10-05 13:39:51`'
  ].join('\n');
  const drift = parseMigrationList(sample).filter(x=>x.local!==x.remote);
  assert.deepEqual(drift, [
    {local:'20260920101150',remote:''},
    {local:'20260920102450',remote:''},
    {local:'20260925080500',remote:''},
    {local:'20261005133951',remote:''}
  ]);
  assert.equal(drift.some(x=>Boolean(x.remote)), false);
});

test('both trusted repair parsers trim again after removing presentation backticks', () => {
  const normalizers = workflow.match(/replace\(\/\^\\`\|\\`\$\/g,''\)\.trim\(\)/g) || [];
  assert.equal(normalizers.length, 2);
  assert.match(workflow, /REMOTE_ONLY_OR_IDENTITY_DRIFT/);
  assert.match(workflow, /UNEXPECTED_PRE_REPAIR_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
});
