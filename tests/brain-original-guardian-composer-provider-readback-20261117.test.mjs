import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261117124500_original_guardian_composer_http_consumer_proof_v3.sql',import.meta.url),'utf8');

test('same original #171 service-only trigger; no new parallel executor or transport',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/i);
  assert.match(sql,/RETURNS trigger/i);
  assert.match(sql,/NEW\.onderdeel IS DISTINCT FROM 'powerhouse-email-executor'/);
  assert.match(sql,/NEW\.gegevens->>'contract' IS DISTINCT FROM 'powerhouse-email-execution-watchdog-v1'/);
  assert.match(sql,/pg_try_advisory_xact_lock/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+FROM PUBLIC,anon,authenticated/i);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+TO service_role/i);
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|CREATE\s+TRIGGER|CREATE\s+TABLE|ALTER ROLE/i);
});

test('match real external composer response by exact original heartbeat pg_net request ID',()=>{
  assert.match(sql,/FROM public\.powerhouse_runtime_events h\s+JOIN net\._http_response r/i);
  assert.match(sql,/r\.id=CASE/i);
  assert.match(sql,/h\.evidence#>>'\{composer,request_id\}'/);
  assert.match(sql,/h\.event_type='commercial_heartbeat'/);
  assert.match(sql,/h\.evidence#>>'\{composer,contract\}'='powerhouse-human-sales-composer-dispatch-v2'/);
  assert.match(sql,/h\.occurred_at>=v_now-interval '50 minutes'/);
  assert.match(sql,/ORDER BY h\.occurred_at DESC\s+LIMIT 1/);
});

test('repeated 503 SQL timeouts turn the same original guardian red without source or send spoofing',()=>{
  assert.match(sql,/ORIGINAL_COMPOSER_PLAN_READ_SQL_TIMEOUT/);
  assert.match(sql,/v_composer_http_status=503/);
  assert.match(sql,/PLAN_READ:canceling statement due to statement timeout/);
  assert.match(sql,/v_composer_failed:=coalesce\(v_composer_http_status>=400,false\)/);
  assert.match(sql,/WHEN v_composer_failed OR v_news_plan_limit_hit/);
  assert.match(sql,/AND NOT v_composer_failed/);
  assert.match(sql,/OR v_news_stale OR v_composer_failed/);
});

test('HTTP200 processed is consumer-only proof, never Gmail send permission',()=>{
  assert.match(sql,/v_composer_http_status=200 AND v_composer_processed>0/);
  assert.match(sql,/ORIGINAL_COMPOSER_PROCESSED_NOT_GMAIL_SENT/);
  assert.match(sql,/'composer_processed_actions',v_composer_processed/);
  assert.match(sql,/'composer_consumed_not_gmail_sent'/);
  assert.match(sql,/'provider_result_proven_by_guardian',false/);
  assert.match(sql,/'release_green_proven',false/);
  assert.doesNotMatch(sql,/provider_ack_verified.*true|status\s*=\s*'done'/i);
});

test('original source quota, consent gate, dedupe and non-red failure fallback are preserved',()=>{
  assert.match(sql,/TAVILY_PLAN_LIMIT_EXCEEDED/);
  assert.match(sql,/SOURCE_UNVERIFIED_KEEP_HOLD_AND_RESEARCH_DUE_ONLY/);
  assert.match(sql,/v_event_key := 'original-result-guardian:'\|\|v_hour/);
  assert.match(sql,/ON CONFLICT \(dedupe_key\) DO NOTHING/);
  assert.match(sql,/EXCEPTION WHEN OTHERS THEN/);
});


test('migration must contain exactly one balanced original PL/pgSQL function body',()=>{
  const tags=[...sql.matchAll(/\$function\$/g)].map(x=>x.index);
  assert.equal(tags.length,2,'extra dollar quote delimiter must never pass admission');
  assert.ok(sql.indexOf("v_event_key := 'original-result-guardian:'") < tags[1]);
  assert.ok(sql.indexOf("v_composer_result:=CASE") < tags[1]);
  assert.ok(sql.indexOf("REVOKE ALL ON FUNCTION") > tags[1]);
});
