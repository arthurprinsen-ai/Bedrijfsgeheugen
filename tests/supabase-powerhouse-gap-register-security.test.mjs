import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915110500_powerhouse_gap_register_security_hardening.sql';

test('Powerhouse gap register is service-role only',()=>{
  const sql=readFileSync(migration,'utf8');
  assert.match(sql,/alter view public\.powerhouse_gap_register_v1 set \(security_invoker = true\)/i);
  assert.match(sql,/revoke all on table public\.powerhouse_gap_register_v1 from public, anon, authenticated/i);
  assert.match(sql,/grant select on table public\.powerhouse_gap_register_v1 to service_role/i);
  assert.match(sql,/powerhouse-gap-register-browser-exposure-v1/i);
});