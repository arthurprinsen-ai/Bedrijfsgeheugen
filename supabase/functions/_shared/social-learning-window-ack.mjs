/** Exact-source completion of the ORIGINAL 24/48/72h social measurement obligation.
 * This is an ACK of an observed metric, never a causal experiment winner, 
 * revenue receipt, new publisher, or permission to re-send a post. */
const fields=['impressions','reach','likes','reactions','comments','shares','saves','clicks','views'];
const legacy={impressions:'Impressions',reach:'Reach',reactions:'Reactions',
  comments:'Comments',shares:'Shares',saves:'Saves',views:'Views'};
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const millis=v=>{const n=Date.parse(String(v||''));return Number.isFinite(n)?n:null;};
const read=(metrics,key)=>metrics?.[key]??metrics?.[legacy[key]];
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
    ['OBSERVED','PROVIDER_OBSERVED'].includes(s.data_quality)&&
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
