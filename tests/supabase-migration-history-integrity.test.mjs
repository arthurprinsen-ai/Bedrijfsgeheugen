import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const files = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(name => name.endsWith('.sql'));
const parsed = files.map(name => {
  const match = name.match(/^(\d{14})_(.+)\.sql$/);
  assert.ok(match, `Malformed migration filename: ${name}`);
  return { version: match[1], name: match[2], filename: name };
});
const byVersion = new Map(parsed.map(item => [item.version, item]));
const applied = new Map(lock.applied.map(item => [item.version, item.name]));
const pending = new Map((lock.replay_baselines_pending_repair || []).map(item => [item.version, item.name]));

test('production migration version and name identities are exact in the executable lane', () => {
  const missing = [];
  const mismatched = [];
  for (const [version, name] of applied) {
    const local = byVersion.get(version);
    if (!local) missing.push(`${version} ${name}`);
    else if (local.name !== name) mismatched.push(`${version}: production=${name} repository=${local.name}`);
  }
  assert.deepEqual(missing, [], `Production migrations missing locally:\n${missing.join('\n')}`);
  assert.deepEqual(mismatched, [], `Production migration identities mismatched:\n${mismatched.join('\n')}`);
});

test('only explicitly pending replay baselines may be local-only', () => {
  const unexpected = parsed.filter(item => !applied.has(item.version) && !pending.has(item.version));
  assert.deepEqual(unexpected, [], `Unexpected local-only executable migrations:\n${unexpected.map(x => x.filename).join('\n')}`);
});

test('archived repository-only versions never re-enter the executable lane', () => {
  const returned = (lock.forbidden_repository_only_versions || []).filter(version => byVersion.has(version));
  assert.deepEqual(returned, [], `Archived repository-only versions returned to executable lane: ${returned.join(', ')}`);
});

test('migration versions are unique and SQL is non-empty', async () => {
  assert.equal(byVersion.size, parsed.length, 'Duplicate migration versions are forbidden');
  const empty = [];
  for (const item of parsed) {
    const sql = await readFile(new URL(`../supabase/migrations/${item.filename}`, import.meta.url), 'utf8');
    if (!sql.trim()) empty.push(item.filename);
  }
  assert.deepEqual(empty, [], `Empty or whitespace-only migration SQL is forbidden:\n${empty.join('\n')}`);
});

test('no replay-baseline migration-history repair obligation remains before terminal merge', () => {
  const unresolved = (lock.replay_baselines_pending_repair || []).filter(item => item.status !== 'REPAIRED_APPLIED_VERIFIED');
  assert.deepEqual(unresolved, [], `Replay baselines still require supported Supabase migration repair/readback:\n${unresolved.map(x => `${x.version} ${x.name} ${x.status}`).join('\n')}`);
});
