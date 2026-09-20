import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('Composio admin migration identity mirrors production exactly',()=>{
  const canonical='supabase/migrations/20260920112118_admin_composio_key_onboarding.sql';
  const stale='supabase/migrations/20260920111000_admin_composio_key_onboarding.sql';
  assert.equal(existsSync(canonical),true);
  assert.equal(existsSync(stale),false);
  const sql=readFileSync(canonical,'utf8');
  assert.match(sql,/powerhouse_set_composio_api_key_v1/);
  assert.match(sql,/grant execute on function public\.powerhouse_set_composio_api_key_v1\(text\) to service_role/);
});
