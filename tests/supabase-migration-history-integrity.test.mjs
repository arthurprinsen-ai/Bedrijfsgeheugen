import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const dir = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(dir)).filter(name => name.endsWith('.sql')).sort();

const parsed = files.map((name) => {
  const match = name.match(/^(\d{14})_([A-Za-z0-9_.-]+)\.sql$/);
  assert.ok(match, `Malformed migration filename: ${name}`);
  return { name, version: match[1], semanticName: match[2] };
});

test('migration files have unique canonical versions and non-empty SQL', async () => {
  const seen = new Map();
  for (const item of parsed) {
    const existing = seen.get(item.version);
    assert.equal(existing, undefined, `Duplicate migration version ${item.version}: ${existing}, ${item.name}`);
    seen.set(item.version, item.name);
    const sql = await readFile(new URL(item.name, dir), 'utf8');
    assert.ok(sql.trim().length > 0, `Empty migration SQL is forbidden: ${item.name}`);
  }
});

test('repository migration versions exactly match production migration history lock', () => {
  const localVersions = parsed.map(item => item.version).sort();
  const remoteVersions = lock.applied.map(item => item.version).sort();
  assert.deepEqual(localVersions, remoteVersions, 'Local/remote migration version parity is required; placeholders and timestamp aliases are not accepted');
});

test('repository migration names exactly match production migration history lock', () => {
  const localByVersion = new Map(parsed.map(item => [item.version, item.semanticName]));
  const mismatches = lock.applied
    .filter(item => localByVersion.get(item.version) !== item.name)
    .map(item => ({ version: item.version, local: localByVersion.get(item.version) ?? null, remote: item.name }));
  assert.deepEqual(mismatches, [], `Migration names must match production history exactly: ${JSON.stringify(mismatches)}`);
});

test('3742 recovery remains fail-closed until reproducible parity is proven', () => {
  assert.equal(lock.recovery_governance.issue, 3742);
  assert.equal(lock.recovery_governance.empty_placeholder_migrations_forbidden, true);
  assert.equal(lock.recovery_governance.closure_requires_reproducible_replay, true);
  assert.equal(lock.recovery_governance.closure_requires_remote_local_parity, true);
});
