import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  originalProviderPollReceiptIdentity,
  originalProviderPollAuditEvent,
  assertOriginalProviderPollReceipt,
  originalProviderMetricSnapshotIdentity
} from '../supabase/functions/_shared/original-provider-poll-receipt.mjs';

const idA='eb6acdb5-0462-4d4b-b9d0-675cf090a501';
const idB='9e840f21-9db7-4dcc-b83f-99dd3f963a12';
const make=(startedAt,runId=idA)=>originalProviderPollReceiptIdentity({startedAt,runId});

test('same original #177 provider reader: actual execution has unique append-only audit event identity',()=>{
  const one=make('2026-11-13T00:18:02.001Z');
  const two=make('2026-11-13T06:18:02.001Z',idB);
  assert.notEqual(one.dedupeKey,two.dedupeKey);
  assert.equal(one.slotStart,'2026-11-13T00:00:00.000Z');
  assert.equal(two.slotStart,'2026-11-13T06:00:00.000Z');
  assert.equal(one.sourceJobId,177);
  assert.equal(one.sourceSchedule,'18 */6 * * *');
  assert.equal(one.owner,'bg-social-metrics-sync');
  assert.equal(make('2026-11-13T12:18:01Z').slotStart,'2026-11-13T12:00:00.000Z');
  assert.equal(make('2026-11-13T18:18:01Z').slotStart,'2026-11-13T18:00:00.000Z');
});

test('timezone, DST and midnight do not merge distinct observed provider invocations',()=>{
  const one=make('2026-10-25T00:18:00Z',idA);
  const two=make('2026-10-25T06:18:00Z',idB);
  assert.notEqual(one.slotStart,two.slotStart);
  assert.notEqual(one.dedupeKey,two.dedupeKey);
  assert.equal(make('2026-11-13T23:59:59Z').slotStart,'2026-11-13T18:00:00.000Z');
  assert.equal(make('2026-11-14T00:00:00Z').slotStart,'2026-11-14T00:00:00.000Z');
});

test('retries are distinct truthful attempts; same runId reconstructs its one receipt',()=>{
  const first=make('2026-11-13T06:18:00.001Z',idA);
  const retry=make('2026-11-13T06:19:00.001Z',idB);
  assert.equal(first.slotStart,retry.slotStart);
  assert.notEqual(first.dedupeKey,retry.dedupeKey);
  assert.equal(make(first.startedAt,idA).dedupeKey,first.dedupeKey);
});

test('fail closed on invalid source time and run identity, never silently reuse old daily key',()=>{
  assert.throws(()=>make('no-date'),/START_TIME_INVALID/);
  assert.throws(()=>make('2026-11-13T06:18:00Z','bad-id'),/RUN_ID_INVALID/);
  assert.notEqual(make('2026-11-13T06:18:00Z').dedupeKey,'provider-social-metrics:2026-11-13');
});

test('each original source failure is persisted as an error receipt, not a learning or revenue outcome',()=>{
  const identity=make('2026-11-13T06:18:00Z');
  const failed=originalProviderPollAuditEvent({
    identity,outcome:{healthy:false,provider_snapshots:1,linkedin_personal:{status:'PARTIAL_SCOPE_OBSERVED'},instagram:{status:'UNAVAILABLE'},original_publication_metric_handoff:{overdue_count:1,failed_count:0}}
  });
  const good=originalProviderPollAuditEvent({
    identity:make('2026-11-13T12:18:00Z',idB),
    outcome:{healthy:true,provider_snapshots:4}
  });
  assert.equal(failed.state,'error');
  assert.equal(failed.data_quality,'PARTIAL');
  assert.equal(good.state,'observed');
  assert.equal(failed.event_type,'provider_social_metric_ingest_receipt');
  assert.equal(failed.evidence.original_run_id,idA);
  assert.equal(failed.evidence.original_source_only_not_learning_ack,true);
  assert.equal(failed.evidence.original_consumer_measurement_proven,false);
  assert.equal(failed.evidence.original_causal_learning_proven,false);
  assert.equal(failed.context.original_source_job_id,177);
  assert.notEqual(failed.dedupe_key,good.dedupe_key);
  assert.equal(assertOriginalProviderPollReceipt({
    dedupe_key:failed.dedupe_key,event_type:failed.event_type,state:failed.state,
    evidence:failed.evidence
  },failed),true);
  for(const mutated of [
    {...failed,dedupe_key:'different'},
    {...failed,event_type:'provider_social_metric_ingest'},
    {...failed,state:'observed'},
    {...failed,evidence:{...failed.evidence,original_run_id:idB}},
    {...failed,evidence:{...failed.evidence,original_poll_slot_utc:'wrong'}}
  ])assert.throws(()=>assertOriginalProviderPollReceipt(mutated,failed),/READBACK_MISMATCH/);
});

test('same original #177 Edge function: durable per-attempt readback BEFORE legacy daily summary',()=>{
  const source=readFileSync(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
  const helper=readFileSync(new URL('../supabase/functions/_shared/original-provider-poll-receipt.mjs',import.meta.url),'utf8');
  const first=source.indexOf(".insert(audit).select('dedupe_key,event_type,state,evidence').single()");
  const independent=source.indexOf(".eq('dedupe_key',pollIdentity.dedupeKey).maybeSingle()");
  const last=source.indexOf("dedupe_key:'provider-social-metrics:'+day");
  assert.ok(first>0&&independent>first&&last>independent,
    'original INSERT must be followed by a separate source SELECT before the daily projection');
  assert.match(source,/assertOriginalProviderPollReceipt\(acceptedReceipt,audit\)/);
  assert.match(source,/assertOriginalProviderPollReceipt\(independentReceipt,audit\)/);
  assert.match(source,/original_poll_receipt_verified:true/);
  assert.match(source,/event_type:'provider_social_metric_ingest'/);
  assert.match(helper,/event_type:'provider_social_metric_ingest_receipt'/);
  assert.match(source,/\.upsert\(\{\s*dedupe_key:'provider-social-metrics:'\+day/);
  assert.match(source,/crypto\.randomUUID\(\)/);
  assert.match(source,/healthy\?'observed':'error'/);
  assert.match(source,/INSTAGRAM_GET_IG_MEDIA_INSIGHTS/);
  assert.match(source,/LINKEDIN_LIST_REACTIONS/);
  assert.doesNotMatch(source,/cron\.schedule|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA/);
});

test('original per-post provider metrics keep four distinct real source-time observations every UTC day',()=>{
 const provider='17929031778142284';
 const slots=['2026-11-13T00:00:00.000Z','2026-11-13T06:00:00.000Z',
  '2026-11-13T12:00:00.000Z','2026-11-13T18:00:00.000Z'];
 const events=slots.map(slotStart=>originalProviderMetricSnapshotIdentity({
  platform:'instagram',providerId:provider,slotStart
 }));
 assert.equal(new Set(events).size,4);
 assert.ok(events.every(z=>z.includes(':'+provider+':')));
 assert.equal(originalProviderMetricSnapshotIdentity({
  platform:'instagram',providerId:provider,slotStart:slots[2]
 }),events[2],'same source UTC slot must be idempotent');
 assert.notEqual(events[0],'composio:instagram:'+provider+':2026-11-13',
  'legacy daily source event must remain preserved and never overwritten');
 const urn='urn:li:share:7526178124292718592';
 const li=originalProviderMetricSnapshotIdentity({
  platform:'linkedin',providerId:urn,slotStart:slots[1]
 });
 assert.ok(li.includes(':'+urn+':'));
});

test('source event identity rejects unverified accounts, bad IDs and invented time buckets',()=>{
 const valid='2026-11-13T06:00:00.000Z';
 for(const c of [
  {platform:'instagram',providerId:'not-an-id',slotStart:valid},
  {platform:'linkedin',providerId:'linkedin:alias',slotStart:valid},
  {platform:'linkedin',providerId:'urn:li:organization:18234216',slotStart:valid},
  {platform:'other',providerId:'12345678901',slotStart:valid},
  {platform:'instagram',providerId:'17929031778142284',slotStart:'2026-11-13T06:18:00Z'},
  {platform:'instagram',providerId:'17929031778142284',slotStart:'invalid'}
 ])assert.throws(()=>originalProviderMetricSnapshotIdentity(c),/ORIGINAL_PROVIDER_SNAPSHOT_/);
});

test('the ONE existing original #177 metric reader persists source-time slots, without overwriting same-day earlier measurements',()=>{
 const source=readFileSync(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
 assert.match(source,/const snapshotId=originalProviderMetricSnapshotIdentity\(\{platform,providerId,slotStart\}\)/);
 assert.match(source,/const pollIdentity=originalProviderPollReceiptIdentity\(\{/);
 assert.match(source,/await instagram\(db,apiKey,pollIdentity\.slotStart\)/);
 assert.match(source,/await linkedin\(db,apiKey,pollIdentity\.slotStart\)/);
 assert.match(source,/\.upsert\(\{[\s\S]*?snapshot_id:snapshotId/);
 assert.match(source,/onConflict:'tenant_id,source_event_id'/);
 assert.doesNotMatch(source,/const snapshotId='composio:'\+platform\+':'\+providerId\+':'\+day/);
 assert.doesNotMatch(source,/cron\.schedule|INSTAGRAM_CREATE_MEDIA|LINKEDIN_CREATE_LINKED_IN_POST/);
});
