import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tool = new URL('../scripts/ci/migration-source-preflight.mjs', import.meta.url);
function fixture(archived = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-preflight-'));
  fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(root, 'supabase/migrations'), { recursive: true });
  fs.mkdirSync(path.join(root, 'supabase/migration-history/repository-only'), { recursive: true });
  const name = '20261025000000_retired_example.sql';
  const original = 'supabase/migrations/' + name;
  const testPath = path.join(root, 'tests/example.test.mjs');
  fs.writeFileSync(testPath, "const source = '" + original + "';\nassert.match(sql, /REVOKE/);\n");
  if (archived) fs.writeFileSync(path.join(root, 'supabase/migration-history/repository-only', name), 'REVOKE ALL ON schema.table FROM anon;\n');
  return { root, testPath, original };
}
function run(root, apply = false) {
  return spawnSync(process.execPath, [tool.pathname, root, ...(apply ? ['--apply'] : [])], { encoding: 'utf8' });
}
test('detects retired SQL without modifying assertions', t => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const before = fs.readFileSync(f.testPath, 'utf8');
  const result = run(f.root);
  assert.equal(result.status, 1);
  assert.equal(fs.readFileSync(f.testPath, 'utf8'), before);
  assert.equal(JSON.parse(result.stdout).archivalCandidates.length, 1);
});
test('opt-in repair only rewrites exact archived path and is idempotent', t => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  assert.equal(run(f.root, true).status, 0);
  const content = fs.readFileSync(f.testPath, 'utf8');
  assert.match(content, /supabase\/migration-history\/repository-only/);
  assert.match(content, /assert\.match\(sql, \/REVOKE\//);
  assert.equal(run(f.root, true).status, 0);
  assert.equal(fs.readFileSync(f.testPath, 'utf8'), content);
});
test('unknown source fails closed even with repair option', t => {
  const f = fixture(false);
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  assert.equal(run(f.root, true).status, 1);
  assert.match(fs.readFileSync(f.testPath, 'utf8'), /supabase\/migrations/);
});
