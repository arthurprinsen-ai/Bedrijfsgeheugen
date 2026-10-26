import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261007101156_close_current_set_provider_errors_v1.sql','utf8');

test('provider errors become explicit terminal non-send decisions',()=>{
  assert.match(sql,/a\.status='error'/);
  assert.match(sql,/set status='expired'/);
  assert.match(sql,/'decision','OBSERVE'/);
  assert.match(sql,/'send_forbidden',true/);
  assert.match(sql,/powerhouse-current-set-provider-error-closure-v1/);
});

test('heartbeat closes provider errors after canonical dispatch and before assurance',()=>{
  const dispatch=sql.indexOf('powerhouse_dispatch_linkedin_comment_autopilot_v1');
  const close=sql.indexOf('powerhouse_close_current_set_provider_errors_v1(v_run_date,p_now)');
  const assurance=sql.indexOf('powerhouse_commercial_output_assurance_v1');
  assert.ok(dispatch>=0 && close>dispatch && assurance>close);
  assert.match(sql,/'provider_error_closure',v_provider_error_closure/);
  assert.match(sql,/'scheduler_authority','NETLIFY_SUPABASE_EDGE'/);
});
