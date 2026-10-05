import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(migrationsDir)).filter(name => name.endsWith('.sql')).sort();

const parsed = files.map(name => {
  const match = name.match(/^(\d{14})_(.+)\.sql$/);
  assert.ok(match, `Malformed migration filename: ${name}`);
  return { version: match[1], name: match[2], file: name };
});

test('active migration directory exactly matches locked production migration history', () => {
  const actual = parsed.map(({ version, name }) => ({ version, name }));
  assert.deepEqual(actual, lock.applied, 'Local migration versions/names must exactly equal production history lock');
});

test('every active migration contains non-whitespace SQL', async () => {
  const empty = [];
  for (const { file } of parsed) {
    const sql = await readFile(new URL(file, migrationsDir), 'utf8');
    if (!sql.trim()) empty.push(file);
  }
  assert.deepEqual(empty, [], `Empty migration SQL is forbidden:\n${empty.join('\n')}`);
});

test('active migration versions are unique', () => {
  const seen = new Set();
  const duplicates = [];
  for (const { version, file } of parsed) {
    if (seen.has(version)) duplicates.push(file);
    seen.add(version);
  }
  assert.deepEqual(duplicates, [], `Duplicate migration versions are forbidden: ${duplicates.join(', ')}`);
});

test('known timestamp-rewritten migration variants never return', () => {
  const versions = new Set(parsed.map(item => item.version));
  const rewritten = (lock.forbidden_rewritten_versions || []).filter(version => versions.has(version));
  assert.deepEqual(rewritten, [], `Timestamp-rewritten migration versions must be removed: ${rewritten.join(', ')}`);
});
