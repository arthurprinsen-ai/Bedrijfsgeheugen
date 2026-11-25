import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('Composio admin migration identity mirrors production exactly',()=>{
  const canonical='supabase/migrations/20260920112436_admin_composio_key_onboarding.sql';
  // 20260920112118 is a provider-applied production ledger row (see supabase/migration-history.lock.json),
  // so its source file is a required mirror; only the never-applied 20260920111000 identity must stay absent.
  const stale=['supabase/migrations/20260920111000_admin_composio_key_onboarding.sql'];
  const lock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
  const applied=new Set(lock.applied.map(row=>row.version));
  assert.equal(existsSync(canonical),true);
  assert.equal(applied.has('20260920112436'),true);
  assert.equal(applied.has('20260920112118'),true);
  assert.equal(existsSync('supabase/migrations/20260920112118_admin_composio_key_onboarding.sql'),true);
  for (const path of stale) assert.equal(existsSync(path),false);
  const sql=readFileSync(canonical,'utf8');
  assert.match(sql,/powerhouse_set_composio_api_key_v1/);
  assert.match(sql,/grant execute on function public\.powerhouse_set_composio_api_key_v1\(text\) to service_role/);
});
