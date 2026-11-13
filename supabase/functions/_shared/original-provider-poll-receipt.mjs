/** Original #177 six-hour provider-metrics reader, ONE durable observation per
 * actual attempted invocation. Never create a second scheduler or publisher.
 * The existing daily dedupe record remains the consumer-facing summary; this
 * separate original runtime_event type is an audit receipt only.
 *
 * Retry invocations receive distinct run identities because they truly are
 * separate observed attempts; provider post/snapshot ids remain unchanged.
 */
export function originalProviderPollReceiptIdentity({startedAt,runId}={}){
  const time=Date.parse(String(startedAt||''));
  if(!Number.isFinite(time))throw new Error('ORIGINAL_PROVIDER_POLL_START_TIME_INVALID');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(runId||''))){
    throw new Error('ORIGINAL_PROVIDER_POLL_RUN_ID_INVALID');
  }
  const slotStart=new Date(Math.floor(time/(6*60*60*1000))*6*60*60*1000).toISOString();
  return Object.freeze({
    dedupeKey:'provider-social-metrics:run:'+runId,
    slotStart,
    startedAt:new Date(time).toISOString(),
    runId,
    sourceJobId:177,
    sourceSchedule:'18 */6 * * *',
    owner:'bg-social-metrics-sync'
  });
}

/** Build the original audit-only event WITHOUT changing social publication or
 * teaching an unrelated downstream consumer a second "complete" meaning. */
export function originalProviderPollAuditEvent({identity,outcome}={}){
  if(!identity?.dedupeKey||!identity?.runId||!identity?.slotStart)
    throw new Error('ORIGINAL_PROVIDER_POLL_IDENTITY_REQUIRED');
  if(!outcome||typeof outcome.healthy!=='boolean')
    throw new Error('ORIGINAL_PROVIDER_POLL_OUTCOME_REQUIRED');
  return {
    dedupe_key:identity.dedupeKey,
    event_type:'provider_social_metric_ingest_receipt',
    source:'bg-social-metrics-sync',subject_key:'social-learning',channel:'system',
    occurred_at:identity.startedAt,
    evidence:{
      ...outcome,
      original_run_id:identity.runId,
      original_poll_slot_utc:identity.slotStart,
      original_poll_started_at:identity.startedAt,
      original_source_only_not_learning_ack:true,
      original_consumer_measurement_proven:false,
      original_causal_learning_proven:false
    },
    context:{
      provider:'composio',
      learning_authority:'social_metric_snapshots',
      original_source_job_id:identity.sourceJobId,
      original_source_schedule:identity.sourceSchedule,
      original_utc_poll_slot:identity.slotStart,
      writer_owner:identity.owner,
      immutable_audit_receipt:true,
      no_provider_republish:true
    },
    state:outcome.healthy?'observed':'error',
    data_quality:outcome.healthy?'OBSERVED':'PARTIAL',
    confidence:1,
    updated_at:identity.startedAt
  };
}

/** A successful INSERT response is not a provider/consumer readback. Confirm
 * returned exact durable identity and state from the SAME original table. */
export function assertOriginalProviderPollReceipt(saved,expected){
  if(!saved||saved.dedupe_key!==expected?.dedupe_key||
      saved.event_type!=='provider_social_metric_ingest_receipt'||
      saved.state!==expected.state||
      saved.evidence?.original_run_id!==expected.evidence?.original_run_id||
      saved.evidence?.original_poll_slot_utc!==expected.evidence?.original_poll_slot_utc){
    throw new Error('ORIGINAL_PROVIDER_POLL_RECEIPT_READBACK_MISMATCH');
  }
  return true;
}

/** One immutable provider snapshot per actual ORIGINAL six-hour observation.
 * Legacy YYYY-MM-DD snapshots remain untouched: re-polling must never
 * rewrite their historical timestamp or pretend old 24/48/72h evidence exists.
 * Repeating the same scheduled UTC slot uses the same source-event identity,
 * so the existing snapshot upsert stays provider-side-effect idempotent.
 */
export function originalProviderMetricSnapshotIdentity({platform,providerId,slotStart}={}){
  const source=String(platform||'').trim();
  const external=String(providerId||'').trim();
  if(source==='instagram'){
    if(!/^\d{10,25}$/.test(external))
      throw new Error('ORIGINAL_PROVIDER_SNAPSHOT_INSTAGRAM_ID_INVALID');
  }else if(source==='linkedin'){
    if(!/^urn:li:(share|ugcPost):\d+$/.test(external))
      throw new Error('ORIGINAL_PROVIDER_SNAPSHOT_LINKEDIN_ID_INVALID');
  }else throw new Error('ORIGINAL_PROVIDER_SNAPSHOT_PLATFORM_INVALID');
  const time=Date.parse(String(slotStart||''));
  if(!Number.isFinite(time)||new Date(Math.floor(time/(6*60*60*1000))*6*60*60*1000).toISOString()!==slotStart){
    throw new Error('ORIGINAL_PROVIDER_SNAPSHOT_UTC_6H_SLOT_INVALID');
  }
  return 'composio:'+source+':'+external+':'+slotStart;
}
