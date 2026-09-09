import { createHash } from 'node:crypto';

const clean=v=>String(v??'').trim();
const sha=v=>createHash('sha256').update(clean(v)).digest('hex');

export function mapGrowthObservationToPowerhouseEvent(observation={},input={}){
  const type=clean(observation.event_type||input.event_type).toLowerCase();
  const canonical=clean(observation.canonical||input.canonical||input.url);
  const funnel=clean(observation.funnel_stage||input.funnel_stage).toLowerCase();
  const rawTopic=clean(observation.intent_id||input.intent_id||input.intent||input.topic);
  const topicKey=rawTopic||null;
  let eventType='seo_metric_observed';
  if(/lead|contact|scan|form|conversion|cta/.test(type)||/lead|conversion/.test(funnel))eventType='website_conversion';
  if(/lead_created|qualified_lead/.test(type))eventType='lead_created';
  if(/blog.*publish|publish.*blog/.test(type))eventType='blog_published';
  const contentKey=canonical?`url:${sha(canonical)}`:(clean(input.content_key)||null);
  return {
    eventType,
    source:'website-growth',
    channel:'website',
    occurredAt:observation.occurred_at||input.occurred_at||new Date().toISOString(),
    dedupeKey:`growth:${clean(observation.event_id||input.event_id)||sha(JSON.stringify(observation))}`,
    contentKey,
    topicKey,
    canonicalUrl:canonical||null,
    campaignKey:clean(input.campaign)||null,
    dataQuality:'OBSERVED',
    confidence:0.8,
    evidence:{
      sourceEventType:type,
      pageRole:observation.page_role||input.page_role||null,
      funnelStage:observation.funnel_stage||input.funnel_stage||null,
      intent:rawTopic||null,
      attributionRoot:observation.attribution_root||input.attribution_root_key||null,
      source:observation.source||input.source||null,
      medium:observation.medium||input.medium||null,
    },
  };
}
