import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915110500_powerhouse_gap_register_security_hardening.sql';
const replayHardening='supabase/migrations/20260916123957_powerhouse_internal_view_replay_hardening.sql';

test('Powerhouse gap register is service-role only',()=>{
  const sql=readFileSync(migration,'utf8');
  const replaySql=readFileSync(replayHardening,'utf8');
  assert.match(sql,/to_regclass\('public\.powerhouse_gap_register_v1'\)/i);
  assert.match(replaySql,/alter view public\.powerhouse_gap_register_v1 set \(security_invoker = true\)/i);
  assert.match(replaySql,/revoke all on table public\.powerhouse_gap_register_v1 from public, anon, authenticated/i);
  assert.match(replaySql,/grant select on table public\.powerhouse_gap_register_v1 to service_role/i);
  assert.match(sql,/powerhouse-gap-register-browser-exposure-v1/i);
});
