import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const lock=JSON.parse(await readFile(new URL('supabase/migration-history.lock.json',root),'utf8'));
const oldVersion='20261109152200',repeatVersion='20261109152945';
const stem='original_social_provider_refresh_learning_v1.sql';
const [original,mirror]=await Promise.all([
 readFile(new URL('supabase/migrations/'+oldVersion+'_'+stem,root),'utf8'),
 readFile(new URL('supabase/migrations/'+repeatVersion+'_'+stem,root),'utf8')
]);
test('canonical original provider registry is exactly 818 unique real versions',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.applied.length,818);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,818);
 assert.deepEqual(lock.applied.slice(-2),[
  {version:oldVersion,name:'original_social_provider_refresh_learning_v1'},
  {version:repeatVersion,name:'original_social_provider_refresh_learning_v1'}
 ]);
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
});
test('both recorded native provider applies are faithfully mirrored, not new behavior',()=>{
 assert.equal(original,mirror);
 assert.match(original,/create or replace function public\.powerhouse_backfill_social_learning_applications_v1/);
 assert.match(original,/order by m\.observed_at,m\.source_event_id limit 4/);
 assert.match(mirror,/revoke all on function public\.powerhouse_backfill_social_learning_applications_v1/);
 assert.match(mirror,/grant execute on function public\.powerhouse_backfill_social_learning_applications_v1[\s\S]*to service_role/);
 assert.doesNotMatch(mirror,/cron\.schedule|net\.http_post|create table|drop table|delete from supabase_migrations/i);
});
test('this reconciliation never creates a second executor or falsifies learning',()=>{
 assert.match(mirror,/on conflict \(tenant_id,evaluation_id\) do nothing/);
 assert.match(mirror,/if v_affected=0 then continue; end if;/);
 assert.match(mirror,/causal_improvement_verified',false/);
 assert.doesNotMatch(mirror,/set actual_effect\s*=|status='PROVEN'|sample_size\s*=\s*sample_size\s*\+\s*1/i);
});
