import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261116105000_original_infinity_missing_signal_isolated_mux_v3.sql','utf8');

test('historical replay: original canonical v3 mux preserves preexisting v2 and external universe stages',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_runtime_scheduler_mux_v3/i);
  assert.match(sql,/powerhouse_runtime_scheduler_mux_v2\(p_now\)/);
  assert.match(sql,/v_utc_minute\s*=\s*54/);
  assert.match(sql,/powerhouse_refresh_external_intelligence_universe_v1/);
  assert.match(sql,/powerhouse_infinity_operating_loop_v1\(null,v_local::date\)/);
  assert.match(sql,/extract\(hour from v_local\)::integer=7/);
  assert.match(sql,/extract\(minute from v_local\)::integer=41/);
});

test('only exact missing source precondition is isolated, unexpected errors still raise',()=>{
  assert.match(sql,/exception when raise_exception then/);
  assert.match(sql,/if SQLERRM <> 'POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED' then\s*raise;/i);
  assert.match(sql,/SOURCE_EVIDENCE_DUE/);
  assert.match(sql,/independent_provider_result_proven',false/);
  assert.match(sql,/commercial_result_proven',false/);
  assert.match(sql,/NEXT_NATURAL_ORIGINAL_RUN_AFTER_SOURCE_REFRESH/);
});

test('source failure is visible in original mux task evidence and health never false green',()=>{
  assert.match(sql,/coalesce\(v_base->'tasks','\[\]'::jsonb\)\s*\|\|/);
  assert.match(sql,/'task','powerhouse-infinity-current-signal'/);
  assert.match(sql,/'ok',false/);
  assert.match(sql,/v_base:=jsonb_set\(v_base,'\{healthy\}','false'::jsonb,true\)/);
  assert.match(sql,/return coalesce\(v_base,'\{\}'::jsonb\) \|\| jsonb_build_object/);
});

test('production least privilege and one original scheduler only',()=>{
  assert.match(sql,/SECURITY DEFINER/i);
  assert.match(sql,/SET search_path TO 'public', 'pg_catalog'/i);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_runtime_scheduler_mux_v3\(timestamptz\)/i);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_runtime_scheduler_mux_v3\(timestamptz\)\s+TO service_role/i);
  assert.doesNotMatch(sql,/\bcron\.(schedule|alter_job|unschedule)\s*\(|\bnet\.http_post\s*\(|\bcreate\s+(table|trigger|schema)\b/i);
});
