import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261111093500_original_loop_assurance_fault_isolation_v1.sql');
const legacy=read('supabase/migrations/20261110123000_original_content_handoff_no_aging_gap_v2.sql');
const fp='powerhouse|15-loop|unisolated-handoff-fault-blocks-other-owners|20261111-v1';
const testPath='tests/brain-15-loop-assurance-isolated-failure-20261111.test.mjs';

test('historical replay proves the original helper calls previously lacked fault isolation',()=>{
 const previous=legacy.slice(legacy.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_refresh_loop_assurance_v1('));
 assert.ok(previous.includes('perform public.powerhouse_sync_loop_assurance_receipts_v1(p_now);'));
 assert.ok(previous.includes('v_handoff:=public.powerhouse_content_handoff_receipts_v1(p_now);'));
 assert.equal((previous.match(/EXCEPTION WHEN OTHERS/g)||[]).length,0);
});

test('one original 15-loop assurance owner isolates independent failures without faking health',()=>{
 assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.powerhouse_refresh_loop_assurance_v1('));
 assert.equal((sql.match(/EXCEPTION WHEN OTHERS/g)||[]).length,2);
 assert.ok(sql.includes("v_receipt_sync_failure_sqlstate := SQLSTATE;"));
 assert.ok(sql.includes("v_content_handoff_failure_sqlstate := SQLSTATE;"));
 assert.ok(sql.includes("if v_receipt_sync_failure_sqlstate is not null then"));
 assert.ok(sql.includes("v_status:='RED'; v_reason:='original stage receipt synchronization failed"));
 assert.ok(sql.includes("elsif r.loop_key='content-closed-loop'"));
 assert.ok(sql.includes("v_status:='RED'; v_reason:='original content consumer reconciliation failed"));
 assert.ok(sql.includes("for r in"));
 assert.ok(sql.includes("where active=true order by loop_key"));
 assert.ok(sql.includes("v_handoff:=jsonb_build_object("));
 assert.ok(sql.includes("'source_accepted',false"));
 assert.ok(sql.includes("'receipt_sync_failure_sqlstate',v_receipt_sync_failure_sqlstate"));
 assert.ok(sql.includes("'content_handoff_failure_sqlstate',case when r.loop_key='content-closed-loop'"));
 assert.ok(sql.includes("'recovery_owner',v_recovery_owner"));
 assert.ok(sql.includes("'recovery_action',case when v_status='GREEN'"));
 assert.ok(sql.includes("insert into public.brain_obligations("));
 assert.ok(sql.includes("on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)"));
 assert.ok(sql.includes("out_loop_key:=r.loop_key; out_status:=v_status; out_reason:=v_reason;"));
});

test('same original privileges and no extra scheduler, sender or silent completion',()=>{
 assert.ok(sql.includes("SECURITY DEFINER"));
 assert.ok(sql.includes("SET search_path TO 'public', 'pg_catalog'"));
 assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.powerhouse_refresh_loop_assurance_v1(timestamptz)'));
 assert.ok(sql.includes('FROM PUBLIC,anon,authenticated'));
 assert.ok(sql.includes('TO service_role'));
 for(const forbidden of ['cron.schedule','net.http_post','CREATE TABLE','DELETE FROM brain_obligations','UPDATE brain_reconciliation_jobs','status=\'FULFILLED\' WHERE']) {
   assert.ok(!sql.includes(forbidden),'unsafe side effect '+forbidden);
 }
 const lock=JSON.parse(read('supabase/migration-history.lock.json'));
 assert.ok(lock.applied.some(row=>row.version==='20261111093500'&&row.name==='original_loop_assurance_fault_isolation_v1'),'native applied original 09:35 source must be recognized');
 assert.ok(lock.applied.length>=826,'original provider history cannot lose any of its first 826 identities');
 assert.deepEqual(lock.applied.slice(824,826),[
  {version:'20261111093500',name:'original_loop_assurance_fault_isolation_v1'},
  {version:'20261111094222',name:'original_loop_assurance_fault_isolation_v1'}
 ],'original 826-entry prefix and source ordering must remain intact after provider append-only migrations');
 assert.equal(new Set(lock.applied.map(row=>row.version)).size,lock.applied.length,
  'all subsequent applied source versions must remain unique');
 assert.ok(lock.applied.some(row=>row.version==='20261111094222'&&row.name==='original_loop_assurance_fault_isolation_v1'),'native second actual 09:42 source must be recognized without replay');
});

test('one original Brain lesson preserves unresolved evidence and no fictitious production green',()=>{
 const r=JSON.parse(read('brain/learning/2026-11-11-original-loop-handoff-fault-isolation-v1.json'));
 assert.equal(r.fingerprint,fp);
 assert.equal(r.no_second_scheduler,true);
 assert.equal(r.no_provider_replay,true);
 assert.equal(r.original_source_evidence.open_content_handoffs,433);
 assert.equal(r.original_source_evidence.overdue_content_handoffs,403);
 assert.equal(r.original_source_evidence.historical_escalations_no_safe_handler,2);
 assert.equal(r.production_applied_verified,true);
 assert.equal(r.failed_helper_fault_injection_proven_in_production,false);
 assert.equal(r.regression,testPath);
 const doc=read('docs/changes/2026-11-11-one-loop-handoff-failure-isolation.md');
 const ledger=read('docs/development-ledger-events/2026-11-11-one-loop-handoff-failure-isolation.md');
 for(const item of [doc,ledger]){
  assert.ok(item.includes(fp));
  assert.ok(item.includes('EVIDENCE_DUE'));
  assert.ok(item.includes('#4198'));
 }
});
