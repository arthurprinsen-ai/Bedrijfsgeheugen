import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const runner=read('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts');
const migration=read('supabase/migrations/20261007084700_external_commercial_heartbeat_scheduler_authority_v1.sql');

test('authenticated external runner marks scheduler authority inside the heartbeat transaction',()=>{
  assert.match(runner,/set_config\('powerhouse\.external_heartbeat_owner','netlify-supabase-edge-v1',true\)/);
  assert.match(runner,/powerhouse_commercial_heartbeat_v1/);
});

test('regression gate counts legacy and external authorities together and requires exactly one',()=>{
  assert.match(migration,/current_setting\('powerhouse\.external_heartbeat_owner', true\)/);
  assert.match(migration,/v_owner_count :=[\s\S]*v_legacy_owner_count[\s\S]*case when v_external_owner then 1 else 0 end/);
  assert.match(migration,/v_owner_count=1/);
  assert.match(migration,/scheduler_authority/);
  assert.match(migration,/NETLIFY_SUPABASE_EDGE/);
  assert.match(migration,/MULTIPLE/);
});

test('terminal lineage and secondary-owner gates remain fail closed',()=>{
  assert.match(migration,/v_direct_composer_owners=0/);
  assert.match(migration,/v_v2_count=0/);
  assert.match(migration,/v_missing=0/);
  assert.match(migration,/terminal_missing_outcome/);
});
