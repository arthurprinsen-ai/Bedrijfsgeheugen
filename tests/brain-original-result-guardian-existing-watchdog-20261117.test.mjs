import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261117094500_original_result_guardian_existing_watchdog_v1.sql',import.meta.url),'utf8');

test('guardian is invoked by the ORIGINAL #171 email watcher, never a new scheduler',()=>{
  assert.match(sql,/BEFORE INSERT ON public\.bg_gezondheid/i);
  assert.match(sql,/powerhouse-email-executor/);
  assert.match(sql,/powerhouse-email-execution-watchdog-v1/);
  assert.match(sql,/'canonical_scheduler','#171'/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|create\s+table/i);
});

test('guardian routes one safer alternative through canonical approved-person selector only',()=>{
  assert.match(sql,/powerhouse_prepare_connection_email_activation_v1\(v_day,1\)/);
  assert.match(sql,/v_held>0 AND v_ready=0 AND v_uncertain=0/);
  assert.match(sql,/v_today_candidates<5/);
  assert.match(sql,/NOT v_already_checked/);
  assert.match(sql,/original-result-guardian:/);
  assert.match(sql,/ON CONFLICT \(dedupe_key\) DO NOTHING/i);
  assert.match(sql,/pg_try_advisory_xact_lock/);
  assert.match(sql,/Europe\/Amsterdam/);
});

test('cannot resend in unknown provider state or treat research as delivered mail',()=>{
  assert.match(sql,/provider_ambiguity_quarantine,external_resend_forbidden/);
  assert.match(sql,/autonomous_outbound,needs_readback/);
  assert.match(sql,/autonomous_outbound,republish_forbidden/);
  assert.match(sql,/'provider_send_attempted',false/);
  assert.match(sql,/'provider_result_proven_by_guardian',false/);
  assert.doesNotMatch(sql,/gmail\.send|send_email\s*\(|status\s*=\s*'done'/i);
});

test('monitors original handoff and yesterday publication independently from cron success',()=>{
  assert.match(sql,/original_handoff_scorecard_7d,broken_or_unproven_handoffs_7d/);
  assert.match(sql,/research_consumer_receipts/);
  assert.match(sql,/last_day_missing_live_proof/);
  assert.match(sql,/LIVE_PROVEN','MEASURED','LEARNED/);
  assert.match(sql,/NEW\.status := 'fout'/);
  assert.match(sql,/'state','ERROR'/);
});

test('security: no browser role can directly execute the guardian, failure remains red',()=>{
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+FROM PUBLIC, anon, authenticated/i);
  assert.match(sql,/EXCEPTION WHEN OTHERS THEN/);
  assert.match(sql,/NEW\.status := 'fout'/);
});
