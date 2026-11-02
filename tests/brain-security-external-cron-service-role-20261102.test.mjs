import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path='supabase/migrations/20261102181500_external_cron_rpc_service_role_only_v1.sql';
const sql=readFileSync(path,'utf8');
test('privileged external recovery has a scoped and reversible service-role-only grant',()=>{
 assert.match(sql,/ORIGINAL_EXTERNAL_CRON_RPC_IDENTITY_DRIFT/);
 assert.match(sql,/ORIGINAL_EXTERNAL_CRON_SERVICE_ACCESS_MISSING/);
 assert.match(sql,/revoke execute on function public\.powerhouse_external_cron_reconcile_v1\(text\)/i);
 assert.match(sql,/from PUBLIC,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.powerhouse_external_cron_reconcile_v1\(text\) to service_role/i);
 assert.match(sql,/EXTERNAL_CRON_RPC_ACL_READBACK_FAILED/);
 assert.doesNotMatch(sql,/drop function|disable row level security|drop policy|create (?:extension|schema)/i);
});
test('cutover does not replace the existing function, credential store or cron schedules',()=>{
 assert.doesNotMatch(sql,/create or replace function|create function|cron\.alter_job|cron\.unschedule|cron\.schedule|update powerhouse_ops\.external_reconcile_credential/i);
 assert.match(sql,/notify pgrst, 'reload schema'/);
});
test('security-sensitive learning never marks candidate as live or quietly removes auth guard',()=>{
 const l=JSON.parse(readFileSync('brain/learning/2026-11-02-external-cron-service-role-cutover-v1.json','utf8'));
 assert.equal(l.compiler.security_sensitive,true);
 assert.equal(l.compiler.machine_enforceable,true);
 assert.equal(l.proof_state,'AWAITING_ORIGINAL_CALLER_ATTESTATION_AND_PROTECTED_PROVIDER_APPLY');
 for(const lane of ['historical_replay','shadow','canary'])
   assert.deepEqual(l.evaluation[lane],['tests/brain-security-external-cron-service-role-20261102.test.mjs']);
});
