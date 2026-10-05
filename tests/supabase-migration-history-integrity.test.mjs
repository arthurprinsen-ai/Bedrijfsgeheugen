import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const files = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(name => name.endsWith('.sql'));
const parsed = files.map(name => {
  const match = name.match(/^(\d{14})_(.+)\.sql$/);
  return match ? { version: match[1], name: match[2], filename: name } : { version: null, name: null, filename: name };
});
const byVersion = new Map(parsed.filter(item => item.version).map(item => [item.version, item]));
const remoteByVersion = new Map(lock.applied.map(item => [item.version, item]));

test('every remotely applied Supabase migration has exact canonical version and name in git', () => {
  const missing = lock.applied.filter(item => !byVersion.has(item.version));
  const mismatched = lock.applied.filter(item => byVersion.has(item.version) && byVersion.get(item.version).name !== item.name)
    .map(item => ({ version: item.version, production: item.name, repository: byVersion.get(item.version).name }));
  assert.deepEqual(missing, [], `Remote-applied migrations missing locally:\n${missing.map(item => `${item.version} ${item.name}`).join('\n')}`);
  assert.deepEqual(mismatched, [], `Migration version/name drift is forbidden:\n${JSON.stringify(mismatched, null, 2)}`);
});

test('active executable lane contains no repository-only migration versions', () => {
  const repositoryOnly = parsed.filter(item => item.version && !remoteByVersion.has(item.version)).map(item => item.filename);
  assert.deepEqual(repositoryOnly, [], `Repository-only migration aliases must live outside supabase/migrations:\n${repositoryOnly.join('\n')}`);
});

test('known timestamp-rewritten migration variants never return', () => {
  const versions = new Set(parsed.filter(item => item.version).map(item => item.version));
  const rewritten = (lock.forbidden_rewritten_versions || []).filter(version => versions.has(version));
  assert.deepEqual(rewritten, [], `Timestamp-rewritten migration versions must be removed: ${rewritten.join(', ')}`);
});

test('every migration SQL file is non-empty after trimming', async () => {
  const empty = [];
  for (const name of files) {
    const content = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
    if (!content.trim()) empty.push(name);
  }
  assert.deepEqual(empty, [], `Empty or whitespace-only migration SQL is forbidden:\n${empty.join('\n')}`);
});
