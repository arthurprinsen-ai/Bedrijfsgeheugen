import test from 'node:test';
import assert from 'node:assert/strict';
import {selectNextContentChannel,contentGenerationCooldown} from '../supabase/functions/_shared/content-generation-fairness.mjs';

const start=Date.parse('2026-10-11T08:00:00.000Z');

test('personal editorial failure does not starve company and blog',()=>{
  const failure=contentGenerationCooldown('PERSONAL_EDITORIAL_CONTRACT_FAILED:PERSONAL_EDITORIAL_WORD_COUNT',start);
  const pending=[
    {channel:'linkedin_personal',delivery_evidence:{generation_retry_after:failure.retry_after}},
    {channel:'linkedin_company',delivery_evidence:{}},
    {channel:'blog',delivery_evidence:{}}
  ];
  assert.equal(failure.classification,'GENERATION_OR_EDITORIAL_RETRY');
  assert.equal(selectNextContentChannel(pending,start)?.channel,'linkedin_company');
  assert.equal(selectNextContentChannel(pending,start+20*60000)?.channel,'linkedin_personal');
});
test('all pending cooldown gives no candidate but preserves queue',()=>{
  const pending=[{channel:'linkedin_personal',delivery_evidence:{generation_retry_after:'2026-10-11T08:20:00Z'}}];
  assert.equal(selectNextContentChannel(pending,start),null);
  assert.equal(selectNextContentChannel(pending,start+21*60000)?.channel,'linkedin_personal');
});
test('provider 429 insufficient_quota opens an escalating capped same-lane recovery circuit',()=>{
  const reason='AI_PROVIDER_REQUEST_FAILED:429:gpt-5-mini:insufficient_quota:You have no credits remaining.';
  for (const [previousAttempts,hours] of [[0,2],[1,4],[2,8],[3,12],[4,12],[6,12],[10000,12]]) {
    const recovery=contentGenerationCooldown(reason,start,previousAttempts);
    const expected=new Date(start+hours*60*60*1000).toISOString();
    assert.equal(recovery.classification,'PROVIDER_BILLING');
    assert.equal(recovery.attempts,Math.min(10000,previousAttempts+1));
    assert.equal(recovery.retry_after,expected);
    assert.equal(recovery.provider_side_effect,false);
    assert.equal(recovery.requires_authorization,true);
    assert.equal(recovery.recovery_action,'RESTORE_APPROVED_PROVIDER_QUOTA_OR_PROVE_ACTIVE_APPROVED_FALLBACK');
    const queues=[
      {channel:'linkedin_personal',delivery_evidence:{generation_retry_after:recovery.retry_after}},
      {channel:'linkedin_company',delivery_evidence:{}},
    ];
    assert.equal(selectNextContentChannel(queues,start)?.channel,'linkedin_company');
    assert.equal(selectNextContentChannel(queues,start+hours*3600000)?.channel,'linkedin_personal');
  }
});
test('editorial failures retain 20-minute fair retry and no billing authorization',()=>{
  const recovery=contentGenerationCooldown('BLOG_READER_READY_CONTRACT_FAILED:BODY_TOO_SHORT',start,8);
  assert.equal(recovery.classification,'GENERATION_OR_EDITORIAL_RETRY');
  assert.equal(recovery.retry_after,'2026-10-11T08:20:00.000Z');
  assert.equal(recovery.requires_authorization,false);
  assert.equal(recovery.recovery_action,'RETRY_ORIGINAL_CHANNEL_AFTER_COOLDOWN');
});
test('no generation failure may alter previously published rows',()=>{
  const rows=[{channel:'linkedin_company',state:'published',delivery_evidence:{}},
    {channel:'blog',state:'decided',delivery_evidence:{}}].filter(x=>x.state==='decided');
  assert.equal(selectNextContentChannel(rows,start)?.channel,'blog');
});
