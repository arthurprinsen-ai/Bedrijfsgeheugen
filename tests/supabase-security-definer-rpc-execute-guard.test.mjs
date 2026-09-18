import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl=new URL('../supabase/migrations/20260917180600_restrict_security_definer_rpc_execute_v1.sql',import.meta.url);

test('public SECURITY DEFINER workers are not executable by public browser roles',async()=>{
  const sql=(await readFile(migrationUrl,'utf8')).toLowerCase();
  const contracts=[
    {
      lookup:"to_regprocedure('public.enforce_instagram_exact_final_media_gate_v1()')",
      revoke:"revoke execute on function public.enforce_instagram_exact_final_media_gate_v1() from public, anon, authenticated",
      grant:"grant execute on function public.enforce_instagram_exact_final_media_gate_v1() to service_role"
    },
    {
      lookup:"to_regprocedure('public.powerhouse_reconciliation_worker_v1(text,integer)')",
      revoke:"revoke execute on function public.powerhouse_reconciliation_worker_v1(text, integer) from public, anon, authenticated",
      grant:"grant execute on function public.powerhouse_reconciliation_worker_v1(text, integer) to service_role"
    }
  ];
  for(const contract of contracts){
    assert.ok(sql.includes(contract.lookup),contract.lookup);
    assert.ok(sql.includes(contract.revoke),contract.revoke);
    assert.ok(sql.includes(contract.grant),contract.grant);
  }
  assert.doesNotMatch(sql,/grant execute .* to (?:public|anon|authenticated)/);
});
