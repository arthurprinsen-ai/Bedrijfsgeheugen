// Source-backed recovery classifier: only re-bootstrap; never grants permission to publish.
// The independent exact-copy/source/authority/provider gates remain mandatory.
export function hasVerifiedPersonalBuilderEvidence(source) {
  if (!source || typeof source !== 'object') return false;
  return source.ai_native_builder_story_verified === true
    && source.ai_native_builder_policy === 'personal-linkedin-ai-native-builder-v1'
    && source.build_event_verified === true
    && source.arthur_anchor_verified === true
    && source.source_backed === true
    && source.business_topic === true
    && source.corporate_voice === false
    && source.company_page_interchangeable === false
    && source.forced_business_moral === false
    && source.identity_contract === 'arthur-personal-linkedin-identity-v4'
    && source.identity_gate_version === 'channel-identity-hard-gate-v3'
    && typeof source.content_id === 'string' && source.content_id.trim().length > 0
    && (Array.isArray(source.source_lineage)
      ? source.source_lineage.length > 0
      : Boolean(source.source_lineage));
}

// Readiness probes are NOT actual provider submissions or verification attempts.
// Preserve the historical counter; increment it only in real worker/proof branches.
export function unchangedMediaPreflightAttempts(job) {
  const attempts = Number(job?.attempts ?? 0);
  return Number.isSafeInteger(attempts) && attempts >= 0 ? attempts : 0;
}
