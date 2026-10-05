import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const files = (await readdir(migrationsDir)).filter((name) => name.endsWith('.sql')).sort();

test('all active Supabase migration files contain non-whitespace SQL', async () => {
  const empty = [];
  for (const file of files) {
    const sql = await readFile(new URL(file, migrationsDir), 'utf8');
    if (!sql.trim()) empty.push(file);
  }
  assert.deepEqual(empty, [], `empty migration files are forbidden:\n${empty.join('\n')}`);
});

test('repository migration versions exactly match locked production history', () => {
  const local = files.map((name) => {
    const match = name.match(/^(\d{14})_(.+)\.sql$/);
    assert.ok(match, `malformed migration filename: ${name}`);
    return match[1];
  }).sort();
  const remote = lock.applied.map((x) => x.version).sort();
  assert.deepEqual(local, remote, 'migration history parity must fail closed');
});
