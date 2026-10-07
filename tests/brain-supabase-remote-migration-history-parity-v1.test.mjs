import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const lock=JSON.parse(fs.readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const dir=fileURLToPath(new URL('../supabase/migrations/',import.meta.url));
const files=fs.readdirSync(dir).filter(name=>/^\d{14}_.+\.sql$/.test(name));
const byVersion=new Map(files.map(name=>[name.slice(0,14),name]));
const recovered=new Map([
  ['20261007165737','personal_linkedin_dream_builder_human_language_v1'],
  ['20261007165811','personal_linkedin_closed_loop_policy_refresh_v1'],
  ['20261007165818','personal_linkedin_daily_experiment_copy_refresh_v1'],
  ['20261007165821','personal_linkedin_human_language_guard_v1'],
  ['20261007170121','instagram_personal_no_mira_scope_v1'],
  ['20261007171249','personal_linkedin_founder_journey_problem_sources_v1'],
  ['20261007190600','security_definer_browser_execute_closure_v1'],
]);

test('captured production Supabase migration history is fully replayable from repository files',()=>{
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  for(const row of lock.applied){
    assert.ok(byVersion.has(String(row.version)),`remote migration ${row.version} ${row.name} must exist locally`);
  }
  for(const [version,name] of recovered){
    assert.equal(byVersion.get(version),`${version}_${name}.sql`);
  }
});

test('historical predictive founder materializer mirror is least-privilege on fresh replay',()=>{
  const sql=fs.readFileSync(new URL('../supabase/migrations/20261007171249_personal_linkedin_founder_journey_problem_sources_v1.sql',import.meta.url),'utf8');
  assert.match(sql,/security definer/i);
  assert.match(sql,/set search_path to 'public','pg_catalog'/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_materialize_source_backed_channel_candidates_v2\(date\)[\s\S]*from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_materialize_source_backed_channel_candidates_v2\(date\)[\s\S]*to service_role/i);
});

test('production security-definer browser execute closure is preserved as executable migration history',()=>{
  const sql=fs.readFileSync(new URL('../supabase/migrations/20261007190600_security_definer_browser_execute_closure_v1.sql',import.meta.url),'utf8');
  assert.match(sql,/where n\.nspname='public'/i);
  assert.match(sql,/p\.prosecdef/i);
  assert.match(sql,/revoke execute on function %I\.%I\(%s\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function %I\.%I\(%s\) to service_role/i);
});
