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


import { createHash } from 'node:crypto';

function gitBlobSha(content) {
  const body = Buffer.from(content, 'utf8');
  return createHash('sha1').update(Buffer.from(`blob ${body.length}\0`)).update(body).digest('hex');
}

test('dual-lane replay overrides preserve immutable production SQL by exact Git blob identity', async () => {
  const manifest = JSON.parse(await readFile(new URL('../supabase/migration-replay-overrides.json', import.meta.url), 'utf8'));
  assert.equal(manifest.version, 'SUPABASE-MIGRATION-DUAL-LANE-v1');
  assert.ok(Array.isArray(manifest.overrides) && manifest.overrides.length > 0);
  for (const item of manifest.overrides) {
    const immutable = await readFile(new URL(`../${item.immutable_path}`, import.meta.url), 'utf8');
    const executable = await readFile(new URL(`../${item.executable_path}`, import.meta.url), 'utf8');
    assert.equal(gitBlobSha(immutable), item.immutable_git_blob_sha, `immutable production mirror drifted for ${item.migration_version}`);
    assert.notEqual(executable, immutable, `override must represent an explicit replay-safe divergence for ${item.migration_version}`);
    assert.equal(item.production_mutation, false);
  }
});

test('linkedin historical replay override remains fail-closed for personal truth', async () => {
  const executable = await readFile(new URL('../supabase/migrations/20260914133500_linkedin_campaign_identity_reconciliation.sql', import.meta.url), 'utf8');
  const immutable = await readFile(new URL('../supabase/migration-history/immutable/20260914133500_linkedin_campaign_identity_reconciliation.sql', import.meta.url), 'utf8');
  assert.match(immutable, /linkedin_personal/);
  assert.match(immutable, /source_campaign_id like 'li-personal-%'/);
  assert.doesNotMatch(executable, /channel_kind in \('linkedin_personal','linkedin_company','instagram'\)/);
  assert.doesNotMatch(executable, /source_campaign_id like 'li-personal-%'/);
  assert.match(executable, /channel_kind in \('linkedin_company','instagram'\)/);
});
