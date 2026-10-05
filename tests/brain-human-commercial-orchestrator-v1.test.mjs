import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration='supabase/migrations/20261005135000_powerhouse_human_commercial_orchestrator_v1.sql';
const composer='supabase/functions/powerhouse-commercial-message-composer/index.ts';
const compat='supabase/functions/powerhouse-human-sales-composer/index.ts';
const email='supabase/functions/powerhouse-autonomous-outreach/index.ts';
const linkedin='supabase/functions/powerhouse-linkedin-sales-machine/index.ts';
const learning='brain/learning/2026-10-05-human-commercial-orchestrator-v1.json';

test('commercial psychology is a runtime contract, not documentation only', async()=>{
  const [sql,src,learnRaw]=await Promise.all([readFile(migration,'utf8'),readFile(composer,'utf8'),readFile(learning,'utf8')]);
  for(const play of ['value_first','spin_diagnose','challenger_insight','trigger_outreach','followup_new_angle','graceful_close','commitment_close','objection_response','value_comment']){
    assert.match(sql,new RegExp(play));
  }
  for(const mechanism of ['reciprocity','low_reactance','curiosity','mere_exposure','commitment_consistency','risk_reduction']){
    assert.match(sql,new RegExp(mechanism));
  }
  assert.match(sql,/powerhouse_message_quality_v1/);
  assert.match(sql,/powerhouse_commercial_message_candidates_v1/);
  assert.match(sql,/message_strategy/);
  assert.match(src,/personalization_anchor/);
  assert.match(src,/public_source_evidence/);
  assert.match(src,/powerhouse_commercial_message_candidates_v1/);
  assert.match(src,/Composio\/Groq/);
  assert.match(src,/max_tokens:1800/);
  const learn=JSON.parse(learnRaw);
  assert.equal(learn.status,'ACTIVE_PREVENTION');
});

test('external executors are fail-closed on human message quality', async()=>{
  const [mail,li,wrapper]=await Promise.all([readFile(email,'utf8'),readFile(linkedin,'utf8'),readFile(compat,'utf8')]);
  for(const src of [mail,li]){
    assert.match(src,/powerhouse-commercial-message-composer/);
    assert.match(src,/HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);
    assert.match(src,/message_strategy/);
    assert.match(src,/quality_passed/);
    assert.doesNotMatch(src,/functions\/v1\/powerhouse-human-sales-composer/);
  }
  assert.match(wrapper,/canonical:'powerhouse-commercial-message-composer'/);
});

test('candidate filtering occurs before the limit', async()=>{
  const sql=await readFile(migration,'utf8');
  const fn=sql.slice(sql.indexOf('powerhouse_commercial_message_candidates_v1'));
  assert.match(fn,/p\.channel_norm=any\(p_channels\)/);
  assert.match(fn,/p\.action_id=any\(p_action_ids\)/);
  assert.ok(fn.indexOf('p.action_id=any(p_action_ids)') < fn.indexOf('limit greatest'));
});
