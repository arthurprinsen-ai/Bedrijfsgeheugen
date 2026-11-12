/** Exact-source completion of the ORIGINAL 24/48/72h social measurement obligation.
 * This is an ACK of an observed metric, never a causal experiment winner, 
 * revenue receipt, new publisher, or permission to re-send a post. */
const fields=['impressions','reach','likes','reactions','comments','shares','saves','clicks','views'];
const legacy={impressions:'Impressions',reach:'Reach',reactions:'Reactions',
  comments:'Comments',shares:'Shares',saves:'Saves',views:'Views'};
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const millis=v=>{const n=Date.parse(String(v||''));return Number.isFinite(n)?n:null;};
const read=(metrics,key)=>metrics?.[key]??metrics?.[legacy[key]];
/** Linked Windsor company analytics can be used as ORIGINAL observed-window evidence
 * only when the source, exact live provider URN, organization and independent
 * provider-author proof all agree. A provider-date rollup or partial-scope
 * observation is never promoted to an exact post window. */
export function isSourceQualifiedSocialSnapshot(s,externalPostId){
  const quality=String(s?.data_quality??s?.dataQuality??'');
  // A provider label alone is not a metric. Historical snapshots may carry
  // data_quality=OBSERVED with metrics={}; those must not monopolize the hourly
  // evaluation window or create an all-null apparent success.
  if(['OBSERVED','PROVIDER_OBSERVED'].includes(quality))
    return fields.some(key=>valid(read(s?.metrics,key)));
  if(quality!=='PROVIDER_OBSERVED_LINKED'||!externalPostId||
    s?.source!=='windsor-linkedin-company')return false;
  const id=String(s?.source_event_id??s?.sourceEventId??'');
  const m=s?.metrics||{};
  return id.startsWith('windsor:linkedin-company:'+externalPostId+':')&&
    m.provider_post_urn===externalPostId&&
    m.provider_organization_urn==='urn:li:organization:18234216'&&
    m.independent_proof==='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'&&
    m.source_quality_before_link==='PROVIDER_OBSERVED'&&
    m.scope==='company_post_analytics'&&
    typeof m.impressions==='number'&&Number.isFinite(m.impressions)&&m.impressions>=0;
}
export function verifiedSocialWindowAck({obligation,post,evaluation,snapshots=[],toleranceHours=6}={}){
  if(!obligation||!post||!evaluation||!Array.isArray(snapshots))return null;
  const tenant=String(obligation.tenant_id||''),postId=String(obligation.post_id||'');
  const window=Number(obligation.window_hours);
  if(!['canonical','bedrijfsgeheugen'].includes(tenant)||
    !['MISSED_OBLIGATION','UNVERIFIED_OR_PARTIAL_WINDOW'].includes(obligation.type)||
    obligation.status!=='OPEN'||![24,48,72].includes(window)||
    post.tenant_id!==tenant||post.post_id!==postId||
    !String(post.external_post_id||'')||
    evaluation.tenant_id!==tenant||evaluation.post_id!==postId||
    Number(evaluation.window_hours)!==window||
    evaluation.evaluation_id!==`evaluation:${postId}:${window}`)return null;
  const published=millis(post.published_at),evaluated=millis(evaluation.observed_at);
  if(published===null||evaluated===null||evaluated<published)return null;
  const measured=fields.some(k=>valid(evaluation.metric_vector?.[k]));
  if(!measured)return null;
  const checked=snapshots.filter(s=>
    s?.tenant_id===tenant&&s?.post_id===postId&&
    isSourceQualifiedSocialSnapshot(s,post.external_post_id)&&
    typeof s.source_event_id==='string'&&
    s.source_event_id.includes(String(post.external_post_id))&&
    typeof s.source==='string'&&s.source.length>0&&
    millis(s.observed_at)!==null&&
    Math.abs(millis(s.observed_at)-evaluated)<=5000&&
    Math.abs((millis(s.observed_at)-published)/3600000-window)<=toleranceHours&&
    fields.some(k=>valid(read(s.metrics,k))&&valid(evaluation.metric_vector?.[k]))&&
    fields.every(k=>!valid(read(s.metrics,k))||
      !valid(evaluation.metric_vector?.[k])||
      Number(read(s.metrics,k))===Number(evaluation.metric_vector[k]))
  );
  if(!checked.length)return null;
  checked.sort((a,b)=>a.source_event_id.localeCompare(b.source_event_id));
  const s=checked[0];
  return Object.freeze({
    contract:'ORIGINAL_SOCIAL_WINDOW_EVIDENCE_ACK_V1',
    status:'MEASUREMENT_VERIFIED',
    post_id:postId,window_hours:window,
    evaluation_id:evaluation.evaluation_id,
    source_event_id:s.source_event_id,
    source:s.source,data_quality:s.data_quality,observed_at:s.observed_at,
    no_causal_uplift_claim:true,no_social_republish:true,no_unverified_metrics:true
  });
}

/** A comparison observation is evidence only if it is the same authorized
 * tenant/post/provider identity, observed at the actual source time inside
 * the unchanged +/-6h measurement window. Invalid/partial observations
 * must never inflate a cohort, effect size or confidence. */
export function selectQualifiedSocialCohortSnapshot({post,snapshots=[],windowHours,toleranceHours=6}={}){
  const tenant=String(post?.tenant_id||''),postId=String(post?.post_id||'');
  const externalId=String(post?.external_post_id||'');
  const published=millis(post?.published_at);
  const window=Number(windowHours),tolerance=Number(toleranceHours);
  if(!['canonical','bedrijfsgeheugen'].includes(tenant)||!postId||!externalId||
    published===null||![24,48,72].includes(window)||!Number.isFinite(tolerance)||
    tolerance<0||tolerance>6||!Array.isArray(snapshots))return null;
  let best=null,bestDelta=Infinity;
  for(const s of snapshots){
    if(s?.tenant_id!==tenant||s?.post_id!==postId||
      !isSourceQualifiedSocialSnapshot(s,externalId)||
      typeof s.source!=='string'||!s.source.trim()||
      typeof s.source_event_id!=='string'||
      !s.source_event_id.includes(':'+externalId+':'))continue;
    const observed=millis(s.observed_at);
    if(observed===null||observed<published)continue;
    const delta=Math.abs((observed-published)/3600000-window);
    if(delta<=tolerance&&delta<bestDelta){best=s;bestDelta=delta;}
  }
  return best;
}
