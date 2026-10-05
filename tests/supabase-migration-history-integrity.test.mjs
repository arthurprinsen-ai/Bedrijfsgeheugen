import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const files = await readdir(new URL('../supabase/migrations/', import.meta.url));
const versions = new Set(files.filter(name => name.endsWith('.sql')).map(name => name.split('_', 1)[0]));

test('every remotely applied Supabase migration version remains present in git', () => {
  const missing = lock.applied.filter(item => !versions.has(item.version));
  assert.deepEqual(missing, [], `Remote-applied migrations missing locally:
${missing.map(item => `${item.version} ${item.name}`).join('\n')}`);
});

test('known timestamp-rewritten migration variants never return', () => {
  const rewritten = lock.forbidden_rewritten_versions.filter(version => versions.has(version));
  assert.deepEqual(rewritten, [], `Timestamp-rewritten migration versions must be removed: ${rewritten.join(', ')}`);
});


test('every migration SQL file is non-empty after trimming', async () => {
  const sqlFiles = files.filter(name => name.endsWith('.sql'));
  const empty = [];
  for (const name of sqlFiles) {
    const content = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
    if (!content.trim()) empty.push(name);
  }
  assert.deepEqual(empty, [], `Empty or whitespace-only migration SQL is forbidden:
${empty.join('\n')}`);
});
