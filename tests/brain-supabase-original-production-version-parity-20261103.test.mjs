import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ids=[
 ['20261103141902','repair_experimentcyclus_regex_2201b_20261103'],
 ['20261103142201','repair_experimentcyclus_required_started_at_23502_20261103'],
];
for(const [version,name] of ids){
 const sql=readFileSync(new URL('../supabase/migrations/'+version+'_'+name+'.sql',import.meta.url),'utf8');
 test('existing original production migration '+version+' has safe replay source and ACL',()=>{
  assert.ok(sql.includes('Existing provider version '+version+' was ALREADY APPLIED'));
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.bg_experimentcyclus_poort'));
  assert.ok(sql.includes('end;\n$function$;'));
  assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.bg_experimentcyclus_poort(text,jsonb) FROM PUBLIC, anon, authenticated;'));
  assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.bg_experimentcyclus_poort(text,jsonb) TO service_role;'));
  assert.ok(!sql.includes('GRANT EXECUTE ON FUNCTION public.bg_experimentcyclus_poort(text,jsonb) TO anon'));
  assert.ok(!sql.includes('GRANT EXECUTE ON FUNCTION public.bg_experimentcyclus_poort(text,jsonb) TO authenticated'));
  assert.ok(!sql.includes('supabase_migrations.schema_migrations'));
  assert.ok(!sql.includes('cron.schedule'));
 });
}
test('both historical provider versions precede currently unapplied newer migrations',()=>{
 assert.ok(Number(ids[0][0])<Number(ids[1][0]));
 assert.ok(Number(ids[1][0])<20261103143000);
});
