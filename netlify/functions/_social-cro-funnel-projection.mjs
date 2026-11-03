import {buildChannelTrends,socialChannel} from '../../tools/content-growth/social-funnel-trend.mjs';

// This is a read-only projection for the EXISTING owner-only "Andere data" portal.
// The identity and experiment/learning authority remains in ONE BRAIN; no writes, actor PII or provider calls.
const MS_HOUR=3600000;
const ts=value=>{const n=Date.parse(String(value||''));return Number.isFinite(n)?n:null;};
const validQualities=new Set(['OBSERVED','PROVIDER_OBSERVED']);
export function projectSocialCroFunnel({posts=[],snapshots=[],at=new Date().toISOString()}={}){
  const now=ts(at);
  if(now===null)throw new TypeError('INVALID_SOCIAL_FUNNEL_CLOCK');
  const eligible=(Array.isArray(posts)?posts:[]).filter(socialChannel).slice(0,300);
  const snapshotsByPost=new Map();
  for(const snapshot of (Array.isArray(snapshots)?snapshots:[]).slice(0,4000)){
    if(!validQualities.has(snapshot?.data_quality))continue;
    const observation=ts(snapshot.observed_at);
    if(observation===null||observation>now||!snapshot.post_id||!snapshot.tenant_id)continue;
    const key=snapshot.tenant_id+':'+snapshot.post_id;
    if(!snapshotsByPost.has(key))snapshotsByPost.set(key,[]);
    snapshotsByPost.get(key).push(snapshot);
  }
  let windows=0;
  const rows=eligible.map(post=>{
    const published=ts(post.published_at);
    const candidate=published===null?null:(snapshotsByPost.get(post.tenant_id+':'+post.post_id)||[])
      .filter(s=>{const age=ts(s.observed_at)-published;return age>=42*MS_HOUR&&age<=54*MS_HOUR;})
      .sort((a,b)=>Math.abs(ts(a.observed_at)-published-48*MS_HOUR)-Math.abs(ts(b.observed_at)-published-48*MS_HOUR))[0];
    if(candidate)windows++;
    return {...post,trend_observed_at:candidate?.observed_at||null,
      trend_data_quality:candidate?.data_quality||null,trend_metrics:candidate?.metrics||null};
  });
  const channels=buildChannelTrends(rows,{now:new Date(now)});
  const anyComparable=channels.some(c=>c.trend_evidence_state==='COMPARABLE_DESCRIPTIVE_METRICS');
  return {contract:'POWERHOUSE_SOCIAL_CRO_FUNNEL_PORTAL_V1',
    status:anyComparable?'COMPARABLE_DESCRIPTIVE_METRICS':windows>0?'PARTIAL_48H_EVIDENCE':'INSUFFICIENT_48H_EVIDENCE',
    observedAt:at,metricAge:'48H_PLUS_MINUS_6H',channels,
    observedAlignedWindows:windows,
    futureGrowthGuaranteed:false,
    conversionClaim:'UNKNOWN_UNLESS_INDEPENDENTLY_ATTRIBUTED',
    viewerIdentities:'NOT_COLLECTED',
    publicationOwner:'EXISTING_CANONICAL_POWERHOUSE_PUBLISHER',
    nextProof:'provider_post_id -> 48h metric -> verified CTA -> qualified lead -> independently paid order -> applied learning id'
  };
}
