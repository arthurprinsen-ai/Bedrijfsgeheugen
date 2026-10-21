import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const archivePath = new URL('../supabase/migration-history/repository-only/20260915170000_powerhouse_tenant_identity_hardening_v1.sql', import.meta.url);
const legacyTestPath = new URL('./supabase-tenant-identity-hardening-contract.test.mjs', import.meta.url);

// History stays in the repository-only archive: restoring an already-applied
// migration under supabase/migrations risks duplicate-version preview replay.
test('tenant identity regression reads exact archived SQL without weakening RLS checks', () => {
  const sql = readFileSync(archivePath, 'utf8');
  const activeTest = readFileSync(legacyTestPath, 'utf8');

  assert.match(activeTest, /migration-history\/repository-only\/20260915170000_powerhouse_tenant_identity_hardening_v1\.sql/);
  assert.doesNotMatch(activeTest, /new URL\(['"]\.\.\/supabase\/migrations\/20260915170000_powerhouse_tenant_identity_hardening_v1\.sql/);

  const required = [
    /scan_inzendingen[\s\S]*organisatie_id/i,
    /offerte_inzendingen[\s\S]*organisatie_id/i,
    /portaal_stand[\s\S]*organisatie_id/i,
    /references\s+public\.organisaties\s*\(id\)/i,
    /tenant_identity_status/i,
    /verified|demo|unverified/i,
    /auth\.uid\(\)/i,
    /public\.leden/i,
    /klant_slug/i,
    /tenant_identity_status\s*=\s*'verified'/i,
    /trg_scan_uitkomst/i,
    /trg_offerte_uitkomst/i,
    /return new/i,
    /drop policy if exists scan_toevoegen/i,
    /drop policy if exists offerte_toevoegen/i,
    /with check/i,
    /intern\.mijn_organisaties\s*\(\s*\)/i
  ];
  for (const matcher of required) assert.match(sql, matcher);
  const executableSql = sql.split('\n').filter(line => !line.trimStart().startsWith('--')).join('\n');
  assert.doesNotMatch(executableSql, /create\s+policy[\s\S]*?with\s+check\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(sql, /public\.mijn_organisaties\s*\(\s*\)/i);
});
