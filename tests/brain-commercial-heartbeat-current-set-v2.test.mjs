import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261007094500_commercial_heartbeat_current_set_v2.sql','utf8');

test('external heartbeat owns one lightweight commercial continuation',()=>{
  const promote=sql.indexOf('v_promote := public.powerhouse_promote_research_to_social_v1()');
  const reconcile=sql.indexOf('v_current_set := public.powerhouse_reconcile_current_commercial_action_set_v2(v_run_date)');
  const release=sql.indexOf('v_social_release := public.powerhouse_prepare_quality_social_comments_v1(v_run_date)');
  const dispatch=sql.indexOf('v_social_dispatch := public.powerhouse_dispatch_linkedin_comment_autopilot_v1(v_run_date)');
  const closure=sql.indexOf('v_closure := public.powerhouse_commercial_action_closure_watchdog_v1(p_now)');
  const output=sql.indexOf('v_output := public.powerhouse_commercial_output_assurance_v1(v_run_date)');
  assert.ok(promote>=0 && promote<reconcile);
  assert.ok(reconcile<release && release<dispatch && dispatch<closure && closure<output);
  assert.doesNotMatch(sql,/cron\.schedule/i);
});

test('current action set uses current NBA-v5 external actions without mutating action status',()=>{
  assert.match(sql,/powerhouse_commercial_next_best_action_v5/);
  assert.match(sql,/nba-v5-external-current-day/);
  assert.match(sql,/linkedin_personal/);
  assert.match(sql,/linkedin_dm/);
  assert.match(sql,/'status_mutation',false/);
  const reconciler=sql.slice(
    sql.indexOf('create or replace function public.powerhouse_reconcile_current_commercial_action_set_v2'),
    sql.indexOf('create or replace function public.powerhouse_commercial_heartbeat_v1')
  );
  assert.doesNotMatch(reconciler,/set\s+status\s*=/i);
});

test('heartbeat evidence exposes continuation readback',()=>{
  for(const key of ['research_promotion','current_action_set','social_release','social_dispatch','output_assurance']){
    assert.match(sql,new RegExp("'"+key+"'"));
  }
  assert.match(sql,/'scheduler_authority','NETLIFY_SUPABASE_EDGE'/);
});
