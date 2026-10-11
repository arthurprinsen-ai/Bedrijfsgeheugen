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
test('provider billing gets a bounded two-hour retry and increments attempts',()=>{
  const retry=contentGenerationCooldown('credit balance is too low to access Anthropic API',start,4);
  assert.equal(retry.classification,'PROVIDER_BILLING');
  assert.equal(retry.attempts,5);
  assert.equal(retry.retry_after,'2026-10-11T10:00:00.000Z');
  assert.equal(retry.provider_side_effect,false);
});
test('no generation failure may alter previously published rows',()=>{
  const rows=[{channel:'linkedin_company',state:'published',delivery_evidence:{}},
    {channel:'blog',state:'decided',delivery_evidence:{}}].filter(x=>x.state==='decided');
  assert.equal(selectNextContentChannel(rows,start)?.channel,'blog');
});
