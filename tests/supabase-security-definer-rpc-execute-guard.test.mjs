import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl=new URL('../supabase/migrations/20260917180600_restrict_security_definer_rpc_execute_v1.sql',import.meta.url);

test('public SECURITY DEFINER workers are not executable by public browser roles',async()=>{
  const sql=(await readFile(migrationUrl,'utf8')).toLowerCase();
  for(const signature of [
    'public.enforce_instagram_exact_final_media_gate_v1()',
    'public.powerhouse_reconciliation_worker_v1(text, integer)'
  ]){
    assert.match(sql,new RegExp(`revoke execute on function ${signature.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')} from public, anon, authenticated;`));
    assert.match(sql,new RegExp(`grant execute on function ${signature.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')} to service_role;`));
  }
  assert.doesNotMatch(sql,/grant execute .* to (?:public|anon|authenticated)/);
});
