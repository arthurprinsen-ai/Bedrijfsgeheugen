import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts',import.meta.url),'utf8');
const review=source.slice(source.indexOf('async function reviewContactAuthority(){'),source.indexOf('async function runOutboundLanes(){'));

test('commercial contact review runs at most one durable attempt per 15-minute slot',()=>{
  assert.match(review,/floor\(extract\(minute from now\(\)\)\/15\)/);
  assert.match(review,/contact-authority-heartbeat:/);
  assert.match(review,/on conflict\(dedupe_key\) do nothing returning event_id/);
  assert.match(review,/REVIEW_SLOT_ALREADY_CLAIMED/);
  assert.ok(review.indexOf('insert into public.powerhouse_runtime_events')<review.indexOf('powerhouse_contact_authority_review_batch_v1'));
});

test('preserve the separate canonical identity owner and bound the supplemental batch',()=>{
  assert.match(review,/powerhouse-identity-graph-v1/);
  assert.match(review,/powerhouse_contact_authority_review_batch_v1\(\(now\(\) at time zone 'Europe\/Amsterdam'\)::date,200\)/);
  assert.doesNotMatch(review,/powerhouse_contact_authority_review_batch_v1\([^\n]*,500\)/);
  assert.match(review,/set local statement_timeout = '12000ms'/);
});

test('commercial sends remain separately executed and no scheduler disabled',()=>{
  assert.match(source,/const outboundLanesResult=await runOutboundLanes\(\);/);
  assert.match(source,/const result=await runHeartbeat\(\);/);
  assert.match(source,/external_messages_sent:0/);
  assert.doesNotMatch(review,/cron\.(?:unschedule|alter_job|schedule)/);
  assert.match(review,/AUTHORITY_REVIEW_RETRYABLE_ERROR/);
});

test('slot claim failure does not bypass the authority gate',()=>{
  assert.match(review,/if\(!claim\.acquired\)return/);
  assert.match(review,/catch\(error\)/);
  assert.match(review,/slot_reserved:Boolean\(slotKey\)/);
});
