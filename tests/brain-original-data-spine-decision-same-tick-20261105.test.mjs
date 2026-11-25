import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const old=await readFile(new URL('supabase/migrations/20261105132000_original_data_spine_same_tick_stage_receipts_v1.sql',root),'utf8');
const repair=await readFile(new URL('supabase/migrations/20261105134200_original_data_spine_decision_receipt_same_tick_v1.sql',root),'utf8');
const stages=['decision','action','outcome','learning','guard'];

test('source owner writes a real decision in the SAME original 10m watchdog tick, not an unrelated 30m observation',()=>{
 assert.match(old,/foreach v_stage in array array\['action','outcome','learning','guard'\] loop/);
 assert.match(repair,/foreach v_stage in array array\['decision','action','outcome','learning','guard'\] loop/);
 assert.match(repair,/'data-spine-watchdog',v_stage,/);
 assert.match(repair,/'source_check_at',p_now/);
 assert.match(repair,/\),p_now\);/);
 const stageNames=repair.match(/foreach v_stage in array array\[([^\]]+)\]/)?.[1]||'';
 for(const name of stages)assert.ok(stageNames.includes("'"+name+"'"),'missing '+name);
 assert.doesNotMatch(repair,/cron\.schedule|cron\.unschedule|create\s+table|create\s+trigger|CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.powerhouse_refresh_loop_assurance_v1/i);
});
test('no invented customer/business win, honest unhealthy-source and guard evidence',()=>{
 assert.match(repair,/'decision_kind',case when v_stage='decision' and v_gaps=0 then 'VERIFIED_NO_SOURCE_REPAIR_REQUIRED'/);
 assert.match(repair,/when v_stage='decision' then 'ORIGINAL_SOURCE_REPAIR_REQUIRED'/);
 assert.match(repair,/'original_heartbeat_decision',v_stage='decision'/);
 assert.match(repair,/'pass',case when v_stage='guard' then v_gaps=0 else null end/);
 assert.match(repair,/'customer_outcome_verified',false/);
 assert.match(repair,/'causal_learning_verified',false/);
 assert.match(repair,/case when r\.operational_state='HEALTHY' then 'observed' else 'error' end/);
 assert.match(repair,/if r\.operational_state<>'HEALTHY' then v_gaps:=v_gaps\+1/);
 assert.match(repair,/when v_stage='action' and v_gaps=0 then 'VERIFIED_NO_OP'/);
 assert.match(repair,/when v_stage='action' then 'REPAIR_REQUIRED'/);
});
test('existing source health observation/dedupe, portal heartbeat and service-only original privilege preserved',()=>{
 for(const keep of [
  'perform public.powerhouse_data_spine_reconcile_v1(p_now)',
  'source_health_evaluated',
  'portal-state-runtime-heartbeat',
  'powerhouse_data_spine_health_v1',
  'on conflict (dedupe_key) do update set',
  'from public,anon,authenticated',
  'to service_role',
  "'heartbeat_only',true"
 ])assert.ok(repair.includes(keep),keep);
 assert.match(repair,/SECURITY DEFINER/);
 assert.match(repair,/SET search_path TO 'public', 'pg_catalog'/);
 assert.match(repair,/begin;[\s\S]+commit;/);
});
test('the migration adds only a source-backed decision and its typed proof; all prior original source logic is byte-equivalent',()=>{
 const restore=repair
   .replace(/-- P0 2026-11-05:[\s\S]*?-- No second cron, agent, publisher, provider call or data store\./,
      '-- Same original source owner: data-spine-watchdog -> original Heartbeat receipts.\n-- Real source health every 10m, legacy stages every 30m; fail closed on data gaps.\n-- No new cron, table, payer, provider or public security grant.')
   .replace("'decision','action','outcome','learning','guard'","'action','outcome','learning','guard'")
   .replace(/\n        'decision_kind',case when v_stage='decision' and v_gaps=0 then 'VERIFIED_NO_SOURCE_REPAIR_REQUIRED'\n          when v_stage='decision' then 'ORIGINAL_SOURCE_REPAIR_REQUIRED'\n          else null end,\n        'original_heartbeat_decision',v_stage='decision',/,'');
 assert.equal(restore,old);
});
