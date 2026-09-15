import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915170000_powerhouse_tenant_identity_hardening_v1.sql', import.meta.url);
const migration = fs.existsSync(migrationUrl) ? fs.readFileSync(migrationUrl, 'utf8') : '';

const has = (source, pattern, message) => assert.match(source, pattern, message);

test('tenant identity becomes canonical on portal intake tables', () => {
  assert.ok(fs.existsSync(migrationUrl), 'missing tenant identity hardening migration');
  has(migration, /scan_inzendingen[\s\S]*organisatie_id/i, 'scan intake needs canonical organisatie_id');
  has(migration, /offerte_inzendingen[\s\S]*organisatie_id/i, 'offer intake needs canonical organisatie_id');
  has(migration, /portaal_stand[\s\S]*organisatie_id/i, 'portal state needs canonical organisatie_id');
  has(migration, /references\s+public\.organisaties\s*\(id\)/i, 'tenant keys must reference canonical organisations');
});

test('legacy slug is compatibility input, never identity authority', () => {
  has(migration, /tenant_identity_status/i, 'identity evidence status must be stored');
  has(migration, /verified|demo|unverified/i, 'identity states must be explicit');
  has(migration, /auth\.uid\(\)/i, 'authenticated user identity must be checked');
  has(migration, /public\.leden/i, 'membership must bind users to organisations');
  has(migration, /klant_slug/i, 'legacy slug may remain only for compatibility/backfill');
});

test('demo and unverified rows cannot contaminate commercial learning or benchmarks', () => {
  has(migration, /tenant_identity_status\s*=\s*'verified'/i, 'benchmark refresh must require verified tenant evidence');
  has(migration, /trg_scan_uitkomst/i, 'scan commercial outcome trigger must be hardened');
  has(migration, /trg_offerte_uitkomst/i, 'offer commercial outcome trigger must be hardened');
  has(migration, /return new/i, 'unverified/demo outcomes must fail closed without breaking intake');
});

test('RLS no longer accepts arbitrary anonymous tenant assertions', () => {
  has(migration, /drop policy if exists scan_toevoegen/i, 'legacy open scan insert policy must be removed');
  has(migration, /drop policy if exists offerte_toevoegen/i, 'legacy open offer insert policy must be removed');
  has(migration, /with check/i, 'replacement insert policy must validate derived identity state');
  const executableSql = migration
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
  assert.doesNotMatch(executableSql, /create\s+policy[\s\S]*?with\s+check\s*\(\s*true\s*\)/i, 'arbitrary inserts must not remain accepted');
});
