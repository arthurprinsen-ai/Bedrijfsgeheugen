import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(p,'utf8');

test('security advisor browser boundary closure is persisted and fail closed',async()=>{
  const migration=await read('supabase/migrations/20261007190600_security_definer_browser_execute_closure_v1.sql');
  assert.match(migration,/p\.prosecdef/);
  assert.match(migration,/has_function_privilege\('anon',p\.oid,'EXECUTE'\)/);
  assert.match(migration,/has_function_privilege\('authenticated',p\.oid,'EXECUTE'\)/);
  assert.match(migration,/revoke execute on function/i);
  assert.match(migration,/from public, anon, authenticated/i);
  assert.match(migration,/grant execute on function/i);
  assert.match(migration,/to service_role/i);
});

test('security trust posture distinguishes browser exposure from intentional service-only deny-all',async()=>{
  const migration=await read('supabase/migrations/20261007190653_security_trust_posture_verified_no_open_findings_v1.sql');
  assert.match(migration,/rlsNoPolicyBrowserGrantCount/);
  assert.match(migration,/rlsNoPolicyIntentionalDenyAllCount/);
  assert.match(migration,/VERIFIED_NO_OPEN_FINDINGS/);
  assert.match(migration,/DB-RLS-NO-POLICY-BROWSER-GRANT/);
  assert.doesNotMatch(migration,/'DB-RLS-NO-POLICY'/);
});

test('security trust terminal-green learning keeps production claims evidence gated',async()=>{
  const raw=await read('brain/learning/2026-10-07-security-trust-terminal-green-v1.json');
  const learning=JSON.parse(raw);
  assert.equal(learning.compiler.failure_class,'FALSE_PARTIAL_SECURITY_POSTURE');
  assert.equal(learning.evidence.production.browser_executable_security_definers,0);
  assert.equal(learning.evidence.production.rls_no_policy_browser_grants,0);
  assert.equal(learning.evidence.production.snapshot_posture,'VERIFIED_NO_OPEN_FINDINGS');
  assert.equal(learning.evidence.production.finding_count,0);
  assert.equal(learning.evidence.production.evidence_coverage,100);
});
