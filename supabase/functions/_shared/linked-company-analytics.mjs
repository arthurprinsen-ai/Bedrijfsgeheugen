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
   // The current first-party Windsor ingestion stores PROVIDER_OBSERVED at the
   // source row and explicitly marks post identity as still UNLINKED. Preserve
   // both schema versions; never admit unverified/provider-only account rows.
   const priorUnlinked=o?.quality==='PROVIDER_OBSERVED_UNLINKED';
   const stagedProvider=o?.quality==='PROVIDER_OBSERVED'
     &&o?.evidence?.post_identity==='PROVIDER_OBSERVED_UNLINKED';
   if(o?.tenant_id!=='bedrijfsgeheugen'||(!priorUnlinked&&!stagedProvider))continue;
   const meta=o.evidence,metrics=o.metrics;
   // Two independently evidenced formats originate from the same connected Windsor
   // linkedin_organic provider. The original native staging producer writes
   // {source:'linkedin_organic',provider:'windsor.ai',account,post_id,share_id,
   //  share_url}; prior verified test fixtures used a normalized schema.
   // Never accept an arbitrary mixed-schema fallback or a personal actor.
   const normalized=meta?.source==='windsor.ai'&&meta?.provider==='linkedin'
     &&meta?.connector==='linkedin_organic'&&meta?.scope==='post-snapshot';
   const native=meta?.source==='linkedin_organic'&&meta?.provider==='windsor.ai'
     &&typeof meta?.account==='string'&&typeof meta?.post_id==='string'
     &&typeof meta?.share_id==='string'&&typeof meta?.share_url==='string';
   // Native Windsor schema since 8 Nov: provider/account/identity in evidence,
   // exact post URL, share ID and metric date in the metric payload itself.
   const stagedNative=stagedProvider&&meta?.provider==='windsor.ai'
     &&meta?.connector==='linkedin_organic'&&typeof meta?.account==='string'
     &&typeof meta?.provider_date==='string'
     &&typeof metrics?.post_id==='string'&&typeof metrics?.share_id==='string'
     &&typeof metrics?.share_url==='string'&&metrics?.date===meta.provider_date;
   if((!normalized&&!native&&!stagedNative)||!metrics||typeof metrics!=='object'||Array.isArray(metrics))continue;
   const urn=normalized?meta.provider_post_urn:stagedNative?metrics.post_id:meta.post_id;
   if(!urnRe.test(String(urn||''))||o.source_key!=='linkedin_company_post:'+urn)continue;
   if(normalized&&metrics.post_id!==urn)continue;
   if(native&&(meta.share_id!==urn.split(':').at(-1)
     ||meta.share_url!=='https://www.linkedin.com/feed/update/'+urn
     ||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(meta.provider_metric_date||''))))continue;
   if(stagedNative&&(metrics.share_id!==urn.split(':').at(-1)
     ||metrics.share_url!=='https://www.linkedin.com/feed/update/'+urn
     ||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(meta.provider_date)))continue;
   const proof=proofByUrn.get(urn),post=byUrn.get(urn);
   if(!proof||!post)continue;
   const orgId=String(normalized?meta.account_id:meta.account);
   if(!/^[0-9]{5,22}$/.test(orgId)||proof.evidence.author_urn!=='urn:li:organization:'+orgId
     ||proof.evidence.linkedin_readback.author!=='urn:li:organization:'+orgId)continue;
   const dateKey=String(o.metric_date||''),observed=ts(o.source_observed_at),published=ts(post.published_at);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)||observed===null||published===null
     ||(stagedNative&&Math.abs(Date.parse(meta.provider_date+'T00:00:00Z')-
         Date.parse(String(post.published_at).slice(0,10)+'T00:00:00Z'))>86400000)
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
        source_quality_before_link:o.quality,
        independent_proof:'EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'}
   };
   if(!deduped.has(identity)||ts(deduped.get(identity).observed_at)<observed)deduped.set(identity,next);
 }
 return [...deduped.values()].sort((a,b)=>b.observed_at.localeCompare(a.observed_at)).slice(0,bound);
}


/** Original 6-hour observer: audit each *already provider-proven* experiment
 * through independent company post metrics and the existing minute-39 BRAIN
 * evaluation. Report an overdue handoff; never mark an experiment a winner. */
export function evaluateCompanyExperimentHandoffs({
 applications=[],ownedPosts=[],snapshots=[],evaluations=[],now=new Date(),
 metricDueHours=78,evaluationDueHours=84
}={}){
 const clock=now instanceof Date?now:new Date(now);
 if(!Number.isFinite(clock.getTime())||
    ![applications,ownedPosts,snapshots,evaluations].every(Array.isArray))
   throw new TypeError('ORIGINAL_EXPERIMENT_HANDOFF_AUDIT_INPUT_INVALID');
 const validPosts=new Map(ownedPosts.filter(p=>p?.tenant_id==='bedrijfsgeheugen'
   &&p.platform==='linkedin'&&p.channel_kind==='linkedin_company'
   &&urnRe.test(String(p.external_post_id||''))&&p.post_id)
   .map(p=>[p.post_id,p]));
 const details=[];
 const seen=new Set();
 for(const a of applications){
   if(a?.tenant_id!=='bedrijfsgeheugen'||
      a.application_role!=='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'||
      typeof a.application_id!=='string'||typeof a.post_id!=='string'||
      seen.has(a.application_id))continue;
   seen.add(a.application_id);
   const post=validPosts.get(a.post_id);
   const published=ts(post?.published_at);
   // A missing post or bad clock must never turn into an imaginary observation.
   const age=published===null?null:Math.max(0,(clock.getTime()-published)/3600000);
   const validMetrics=post? snapshots.filter(s=>
     s?.tenant_id==='bedrijfsgeheugen'&&s.post_id===post.post_id&&
     s.source==='windsor-linkedin-company'&&
     s.data_quality==='PROVIDER_OBSERVED_LINKED'&&
     s.metrics?.independent_proof==='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'&&
     s.metrics?.provider_organization_urn==='urn:li:organization:18234216'&&
     s.metrics?.provider_post_urn===post.external_post_id&&
     nonneg(s.metrics?.impressions)!==null&&
     typeof s.source_event_id==='string'&&
     ts(s.observed_at)!==null&&ts(s.observed_at)>=published+24*3600000&&
     ts(s.observed_at)<=published+8*86400000&&
     ts(s.observed_at)<=clock.getTime()+300000)
     .sort((l,r)=>ts(r.observed_at)-ts(l.observed_at)):[];
   const validMetric=validMetrics[0]||null;
   const hasExactEvaluation=s=>evaluations.some(e=>
     e?.tenant_id==='bedrijfsgeheugen'&&e.post_id===a.post_id&&
     e.evidence?.application_id===a.application_id&&
     e.evidence?.source_event_id===s.source_event_id&&
     e.evidence?.causal_improvement_verified===false&&
     e.metric_vector?.metric_scope==='DESCRIPTIVE_EXPOSURE_NOT_CAUSAL_LIFT');
   // An older independently evaluated source event remains valid when Windsor
   // later refreshes that post. Track the newer unconsumed event separately;
   // never mark the old evaluation as missing or silently call it fully learned.
   const evaluatedMetric=validMetrics.find(hasExactEvaluation)||null;
   const newerUnconsumed=!!validMetric&&!!evaluatedMetric&&
     validMetric.source_event_id!==evaluatedMetric.source_event_id;
   const newerAge=newerUnconsumed?(clock.getTime()-ts(validMetric.observed_at))/3600000:null;
   const evalPresent=!!evaluatedMetric;
   let state;
   if(!post||published===null)state='ORIGINAL_POST_IDENTITY_MISSING';
   else if(!validMetric)state=age>=metricDueHours?'PROVIDER_METRIC_HANDOFF_OVERDUE':'WAITING_MATURE_PROVIDER_METRIC';
   else if(!evalPresent)state=age>=evaluationDueHours?'BRAIN_EVALUATION_HANDOFF_OVERDUE':'WAITING_BRAIN_EVALUATION';
   else if(newerUnconsumed)state=newerAge>=evaluationDueHours?
     'BRAIN_REFRESH_HANDOFF_OVERDUE':'WAITING_BRAIN_REFRESH';
   else if(!String(a.verification_status||'').startsWith('PROVIDER_METRICS_OBSERVED_'))
     state=age>=evaluationDueHours?'ORIGINAL_APPLICATION_ACK_OVERDUE':'WAITING_APPLICATION_ACK';
   else state='EVALUATED_DESCRIPTIVE_NO_CAUSAL_LIFT';
   const overdue=state==='ORIGINAL_POST_IDENTITY_MISSING'||state.endsWith('_OVERDUE');
   details.push({application_id:a.application_id,post_id:a.post_id,
     provider_post_urn:post?.external_post_id||null,
     published_at:post?.published_at||null,
     age_hours:age===null?null:Math.round(age*100)/100,state,
     overdue,source_event_id:evaluatedMetric?.source_event_id||validMetric?.source_event_id||null,
     newest_provider_event_id:validMetric?.source_event_id||null,
     newest_provider_event_evaluated:!!validMetric&&hasExactEvaluation(validMetric),
     learning_id:a.learning_id||null});
 }
 const overdue=details.filter(x=>x.overdue),verified=details.filter(x=>x.state==='EVALUATED_DESCRIPTIVE_NO_CAUSAL_LIFT');
 return {state:overdue.length?'HANDOFF_OVERDUE':details.length?'VERIFIED_WITH_PENDING':'NO_ELIGIBLE_VERIFIED_EXPERIMENT',
   checked_at:clock.toISOString(),experiment_applications:details.length,
   evaluated_count:verified.length,pending_count:details.length-overdue.length-verified.length,
   newer_sample_waiting_count:details.filter(x=>x.state==='WAITING_BRAIN_REFRESH').length,
   overdue_count:overdue.length,metric_due_hours:metricDueHours,
   evaluation_due_hours:evaluationDueHours,
   overdue_post_urns:overdue.map(x=>x.provider_post_urn).filter(Boolean).slice(0,12),
   stages:details.slice(0,40),
   recovery_owner:'existing bg-social-metrics-sync + original minute39 runtime learning owner',
   recovery_action:overdue.length?'RECHECK_ORIGINAL_WINDSOR_SOURCE_THEN_MINUTE39_BRAIN':'NO_ACTION_REQUIRED',
   causal_improvement_proven:false};
}
