import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const sql=await read('supabase/migrations/20261105132000_original_data_spine_same_tick_stage_receipts_v1.sql');

test('existing watchdog writes all four observational receipts inside the actual source run',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_data_spine_watchdog_v1\(p_now timestamp with time zone DEFAULT now\(\)\)/i);
 assert.match(sql,/perform public\.powerhouse_data_spine_reconcile_v1\(p_now\)/);
 assert.match(sql,/for r in select \* from public\.powerhouse_data_spine_health_v1 loop/);
 assert.match(sql,/foreach v_stage in array array\['action','outcome','learning','guard'\]/);
 assert.match(sql,/perform public\.powerhouse_record_loop_stage_v1\(\s*'data-spine-watchdog',v_stage/);
 assert.match(sql,/\),p_now\);/);
 const sourceReconcile=sql.indexOf('perform public.powerhouse_data_spine_reconcile_v1(p_now)');
 const afterLoop=sql.indexOf('foreach v_stage in array');
 const returnAt=sql.lastIndexOf('return jsonb_build_object(');
 assert.ok(sourceReconcile>=0&&sourceReconcile<afterLoop&&afterLoop<returnAt,
 'record receipts after real source reconciliation, before return');
});

test('source-health guard is never made green from a stale or synthetic provider readback',()=>{
 assert.match(sql,/v_gaps:=v_gaps\+1/);
 assert.match(sql,/'pass',case when v_stage='guard' then v_gaps=0 else null end/);
 assert.match(sql,/'unhealthy_sources',v_gaps/);
 assert.match(sql,/when v_stage='action' and v_gaps=0 then 'VERIFIED_NO_OP'/);
 assert.match(sql,/when v_stage='action' then 'REPAIR_REQUIRED'/);
 assert.match(sql,/'customer_outcome_verified',false/);
 assert.match(sql,/'causal_learning_verified',false/);
 assert.doesNotMatch(sql,/cron\.schedule|cron\.alter_job|create table|create trigger|provider[_-]publish|set_config\('request\.jwt'/i);
});

test('same original least-privilege function, no anonymous execute, exact migration lock',async()=>{
 assert.match(sql,/SECURITY DEFINER/i);
 assert.match(sql,/end;\s*\$function\$;\s*revoke all on function public\.powerhouse_data_spine_watchdog_v1/);
 assert.equal((sql.match(/\$function\$/g)||[]).length,2,'matching PL/pgSQL delimiter pair');

 assert.match(sql,/SET search_path TO 'public', 'pg_catalog'/);
 assert.match(sql,/revoke all on function public\.powerhouse_data_spine_watchdog_v1\(timestamptz\)\s+from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.powerhouse_data_spine_watchdog_v1\(timestamptz\)\s+to service_role/i);
 const lock=JSON.parse(await read('supabase/migration-history.lock.json'));
 const row=lock.applied.filter(x=>x.version==='20261105132000');
 assert.deepEqual(row,[{version:'20261105132000',name:'original_data_spine_same_tick_stage_receipts_v1'}]);
 const originalIndex=lock.applied.findIndex(x=>x.version==='20261105132000');
 const appendedIndex=lock.applied.findIndex(x=>x.version==='20261105134200');
 assert.ok(appendedIndex>originalIndex,'the next provider-applied migration must append, never rewrite original receipt');
 assert.deepEqual(lock.applied[appendedIndex],{version:'20261105134200',name:'original_data_spine_decision_receipt_same_tick_v1'});
 assert.ok(lock.applied.length>=808,'exact canonical migration history must not shrink');
 assert.ok(lock.applied.every((row,i)=>i===0||row.version>lock.applied[i-1].version),'migration versions remain strictly chronological and append-only');
});

test('same original assurance contract, not replacement scheduler or fake learning',async()=>{
 const skill=await read('.agents/skills/powerhouse-self-improvement-layer/SKILL.md');
 assert.match(skill,/2026-11-05 — data-spine original same-tick evidence/i);
 assert.match(skill,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
 const record=JSON.parse(await read('brain/learning/2026-11-05-data-spine-original-stage-cadence-repair-v1.json'));
 assert.equal(record.canonical_incident,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198');
 assert.equal(record.evidence.original_watchdog_interval_minutes,10);
 assert.equal(record.evidence.original_bridge_interval_minutes,30);
 assert.equal(record.evidence.customer_outcome_proven,false);
 assert.equal(record.compiler.machine_enforceable,true);
});
