// Pure decision contract for recovery INSIDE the original #140 content loop.
// No scheduler, provider I/O, external send, manual approval bypass, or second writer.
export const ORIGINAL_GROWTH_CONTRACT = 'original-daily-growth-source-one-loop-v1';
const REVISION_PATTERN = /^[0-9a-f]{64}$/;

export function shouldRepairOriginalGrowthSource(receipt, runDate, localToday) {
  return runDate === localToday
    && receipt?.contract === ORIGINAL_GROWTH_CONTRACT
    && receipt?.source_day === runDate
    && receipt?.consumer_accepted === false
    && receipt?.next_safe_cro_action === 'SOURCE_REVISION_MISMATCH_OR_PRODUCER_MISSING_RETRY_ORIGINAL_175';
}

// A producer write is NOT a receiver ACK. A receiver ACK is NOT a measured effect.
export function verifyOriginalGrowthSourceRecovery({capture, consume, heartbeat, runDate}) {
  const manifest = capture?.seo_website_ai_cro_source_manifest;
  const revision = manifest?.source_revision;
  if (capture?.contract !== 'growth-source-daily-v1'
      || manifest?.contract !== ORIGINAL_GROWTH_CONTRACT
      || manifest?.producer_state !== 'SOURCE_PERSISTED_WAIT_CONSUMER'
      || manifest?.source_day !== runDate
      || manifest?.tenant_id !== 'bedrijfsgeheugen'
      || !REVISION_PATTERN.test(String(revision || ''))
      || !Number.isInteger(manifest?.source_count)
      || manifest.source_count < 8) {
    return {ok:false, reason:'ORIGINAL_175_PRODUCER_PROOF_MISSING'};
  }
  if (consume?.contract !== ORIGINAL_GROWTH_CONTRACT
      || consume?.source_day !== runDate
      || consume?.tenant_id !== 'bedrijfsgeheugen'
      || consume?.consumer_accepted !== true
      || consume?.consumer_source_revision !== revision
      || consume?.source_rows !== manifest.source_count) {
    return {ok:false, reason:'ORIGINAL_140_CONSUMER_EXACT_ACK_MISSING'};
  }
  if (heartbeat?.contract !== 'powerhouse-commercial-intelligence-heartbeat-v5'
      || heartbeat?.daily_source_brain_ack_verified !== true
      || heartbeat?.daily_source_current_raw_manifest_sha256 !== revision
      || heartbeat?.daily_source_brain_stage !== 'ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME') {
    return {ok:false, reason:'ORIGINAL_HEARTBEAT_EXACT_READBACK_MISSING'};
  }
  return {
    ok:true, sourceRevision:revision, sourceCount:manifest.source_count,
    consumerAckProven:true,
    businessEffectProven:false, croExperimentExecuted:false,
    lesson:'SOURCE_RECEIPT_IS_NOT_PROVIDER_EFFECT_OR_REALIZED_VALUE'
  };
}
