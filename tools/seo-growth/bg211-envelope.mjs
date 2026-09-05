import { normalizeUniversalEvent } from '../universal-event-envelope.mjs';

export function toBg211Envelope(observation,now=new Date().toISOString()){
  if(!observation?.schema_version?.startsWith('seo-growth-observation-'))throw new Error('SEO growth observation required');
  return normalizeUniversalEvent({
    event_id:observation.event_id||observation.fingerprint,
    occurred_at:observation.occurred_at||now,
    source_system:observation.source||'website',
    producer_id:'seo-growth-observation',
    domain:'growth',
    event_type:observation.event_type||observation.kind||'observation',
    severity:'info',
    entity_keys:[observation.canonical,observation.intent_id].filter(Boolean),
    correlation_id:observation.fingerprint,
    attribution_root_key:observation.attribution_root||'',
    evidence_refs:observation.evidence_refs||[],
    payload:observation,
    payload_class:'growth-observation',
    privacy_class:'non-pii-analytics',
    retention_tier:'tiered-v1',
    cost_units:0,
    status:'OBSERVED'
  },now);
}
