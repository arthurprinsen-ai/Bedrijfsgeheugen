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

test('repository-only historical variants stay outside executable migration lane except approved replay baselines', () => {
  const approvedReplay = new Set((lock.repair_required_replay_baselines || []).map(item => item.version));
  const leaked = (lock.repository_only_archived || [])
    .filter(item => !approvedReplay.has(item.version))
    .filter(item => versions.has(item.version));
  assert.deepEqual(leaked, [], `Repository-only migration history leaked back into supabase/migrations:\n${leaked.map(item => `${item.version} ${item.path}`).join('\n')}`);
});

test('repair-required replay baselines are explicit, executable, and not falsely marked applied', () => {
  const repair = lock.repair_required_replay_baselines || [];
  assert.deepEqual(
    repair.map(item => item.version).sort(),
    ['20260920101150','20260920102450','20260925080500']
  );
  const applied = new Set(lock.applied.map(item => item.version));
  for (const item of repair) {
    assert.equal(item.repair_status, 'APPLIED_REQUIRED');
    assert.equal(item.sql_execution_required, false);
    assert.equal(item.production_effect_verified, true);
    assert.ok(versions.has(item.version), `Replay baseline must be executable for clean reset: ${item.version}`);
    assert.equal(applied.has(item.version), false, `Repair-required version must not be claimed applied before provider readback: ${item.version}`);
  }
  assert.equal(lock.recovery_governance?.merge_blocked_until_repair_readback, true);
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
