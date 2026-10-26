/** Evidence-preserving bridge between existing LinkedIn company publication proof,
 * read-only Windsor provider snapshots, and the existing social learning store.
 * Never invent metrics or reconcile personal post/account data. */
const urnRe=/^urn:li:(?:share|ugcPost):[0-9]{10,25}$/;
const nonneg=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:
  typeof v==='string'&&/^[0-9]+(?:\.[0-9]+)?$/.test(v)?Number(v):null;
const ts=v=>{const t=Date.parse(String(v||''));return Number.isFinite(t)?t:null;};
export function buildVerifiedCompanyMetricSnapshots({observations=[],publicationProofs=[],ownedPosts=[],now=new Date(),max=30}={}){
 const date=now instanceof Date?now:new Date(now);
 if(Number.isNaN(date.getTime()))throw new TypeError('LINKED_ANALYTICS_INVALID_CLOCK');
 if(!Array.isArray(observations)||!Array.isArray(publicationProofs)||!Array.isArray(ownedPosts))
   throw new TypeError('LINKED_ANALYTICS_SOURCE_ARRAYS_REQUIRED');
 const bound=Math.max(1,Math.min(30,Math.floor(Number(max)||30)));
 const byUrn=new Map(ownedPosts.filter(p=>p?.tenant_id==='bedrijfsgeheugen'
   &&p.platform==='linkedin'&&p.channel_kind==='linkedin_company'
   &&urnRe.test(String(p.external_post_id||''))&&p.post_id).map(p=>[p.external_post_id,p]));
 const proofByUrn=new Map(publicationProofs.filter(p=>p?.tenant_id==='canonical'
   &&p.channel==='linkedin_company'&&p.status==='LIVE_PROVEN'
   &&urnRe.test(String(p.external_id||''))&&ts(p.live_proven_at)!==null
   &&p.evidence?.provider_truth_verified===true
   &&p.evidence?.linkedin_readback?.id===p.external_id
   &&urnRe.test(String(p.evidence?.linkedin_readback?.id||''))).map(p=>[p.external_id,p]));
 const deduped=new Map();
 for(const o of observations){
   if(o?.tenant_id!=='bedrijfsgeheugen'||o.quality!=='PROVIDER_OBSERVED_UNLINKED')continue;
   const meta=o.evidence,metrics=o.metrics;
   if(meta?.source!=='windsor.ai'||meta?.provider!=='linkedin'||meta?.connector!=='linkedin_organic'
     ||meta?.scope!=='post-snapshot'||!metrics||typeof metrics!=='object')continue;
   const urn=meta.provider_post_urn;
   if(!urnRe.test(String(urn||''))||o.source_key!=='linkedin_company_post:'+urn||metrics.post_id!==urn)continue;
   const proof=proofByUrn.get(urn),post=byUrn.get(urn);
   if(!proof||!post)continue;
   const orgId=String(meta.account_id||'');
   if(!/^[0-9]{5,22}$/.test(orgId)||proof.evidence.author_urn!=='urn:li:organization:'+orgId
     ||proof.evidence.linkedin_readback.author!=='urn:li:organization:'+orgId)continue;
   const dateKey=String(o.metric_date||''),observed=ts(o.source_observed_at),published=ts(post.published_at);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)||observed===null||published===null
     ||observed>date.getTime()+300000||date.getTime()-observed>72*3600000
     ||observed<published||published<date.getTime()-35*86400000)continue;
   const impressions=nonneg(metrics.share_impression_count),likes=nonneg(metrics.share_like_count),
     comments=nonneg(metrics.share_comment_count),clicks=nonneg(metrics.share_clicks_count);
   if(impressions===null||likes===null||comments===null||clicks===null)continue;
   const videoViews=nonneg(metrics.share_video_views);
   const identity='windsor:linkedin-company:'+urn+':'+dateKey;
   const next={
      tenant_id:'bedrijfsgeheugen',post_id:post.post_id,snapshot_id:identity,
      source_event_id:identity,source:'windsor-linkedin-company',
      observed_at:new Date(observed).toISOString(),data_quality:'PROVIDER_OBSERVED_LINKED',
      metrics:{impressions,likes,comments,clicks,
        ...(videoViews!==null?{video_views:videoViews}:{}),
        observed_source:'windsor.ai',scope:'company_post_analytics',
        provider_post_urn:urn,provider_organization_urn:'urn:li:organization:'+orgId,
        source_quality_before_link:'PROVIDER_OBSERVED_UNLINKED',
        independent_proof:'EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'}
   };
   if(!deduped.has(identity)||ts(deduped.get(identity).observed_at)<observed)deduped.set(identity,next);
 }
 return [...deduped.values()].sort((a,b)=>b.observed_at.localeCompare(a.observed_at)).slice(0,bound);
}
