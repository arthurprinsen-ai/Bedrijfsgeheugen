import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915104000_powerhouse_autonomy_rpc_security_hardening.sql';

test('autonomous Powerhouse RPCs are fail-closed and deterministic',()=>{
  const sql=readFileSync(migration,'utf8');
  assert.match(sql,/alter function public\.powerhouse_daily_execution_guard\(date\)[\s\S]*set search_path = public, pg_catalog/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_autonomous_growth_revenue_cycle\(date\)[\s\S]*from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_autonomous_growth_revenue_cycle\(date\)[\s\S]*to service_role/i);
  assert.match(sql,/autonomy-security-definer-rpc-browser-exposure-v1/i);
  assert.match(sql,/daily-execution-guard-mutable-search-path-v1/i);
  assert.match(sql,/brain_failure_registry/i);
});
