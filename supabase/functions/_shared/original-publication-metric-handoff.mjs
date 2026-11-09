// Original provider metrics -> original publication obligation handoff.
// Pure identity/source/maturity check: never publishes, guesses missing metrics,
// or creates experiment/learning outcomes.
const clean=v=>String(v??'').trim();
const millis=v=>Date.parse(clean(v));
const validNumber=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const URN=/^urn:li:(?:share|ugcPost):[0-9]+$/;
function accept(ob,post,snapshot,now){
 const ref=clean(ob?.external_id),nowMs=millis(now),published=millis(ob?.published_at),
  live=millis(ob?.live_proven_at),postPublished=millis(post?.published_at),seen=millis(snapshot?.observed_at);
 if(ob?.tenant_id!=='canonical'||ob?.status!=='LIVE_PROVEN'||
    !['linkedin_personal','linkedin_company'].includes(ob.channel)||
    !URN.test(ref)||!Number.isFinite(nowMs)||!Number.isFinite(published)||
    !Number.isFinite(live)||!Number.isFinite(postPublished)||!Number.isFinite(seen)||
    Math.abs(postPublished-published)>300_000||
    seen<published+86_400_000||seen>nowMs+300_000||
    published>nowMs||live>nowMs||live<published-300_000||
    post?.external_post_id!==ref||post?.channel_kind!==ob.channel||
    !clean(post?.post_id)||snapshot?.post_id!==post?.post_id||
    snapshot?.tenant_id!==post?.tenant_id||
    !clean(snapshot?.source_event_id))return null;
 const isPersonal=ob.channel==='linkedin_personal';
 if(post?.tenant_id!==(isPersonal?'canonical':'bedrijfsgeheugen'))return null;
 const m=snapshot?.metrics||{};
 let observed={};
 if(isPersonal){
   if(snapshot?.source!=='composio-linkedin'||
      snapshot?.data_quality!=='OBSERVED_PARTIAL_SCOPE'||
      !clean(snapshot.source_event_id).startsWith('composio:linkedin:'+ref+':')||
      m.metric_scope!=='reactions_only'||m.views_unavailable!==true||
      !validNumber(m.reactions))return null;
   observed={reactions:m.reactions};
 }else{
   if(snapshot?.source!=='windsor-linkedin-company'||
      snapshot?.data_quality!=='PROVIDER_OBSERVED_LINKED'||
      !clean(snapshot.source_event_id).startsWith('windsor:linkedin-company:'+ref+':')||
      m.scope!=='company_post_analytics'||
      m.independent_proof!=='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'||
      m.provider_post_urn!==ref||
      m.provider_organization_urn!=='urn:li:organization:18234216'||
      !validNumber(m.impressions))return null;
   observed={impressions:m.impressions};
   for(const field of ['likes','comments','clicks','video_views'])
     if(validNumber(m[field]))observed[field]=m[field];
 }
 return {contract:'POWERHOUSE_ORIGINAL_PUBLICATION_METRIC_HANDOFF_V1',
   source_event_id:clean(snapshot.source_event_id),post_id:post.post_id,
   provider_post_id:ref,observed_at:new Date(seen).toISOString(),
   source:snapshot.source,data_quality:snapshot.data_quality,
   measurement_scope:isPersonal?'reactions_only':'company_post_analytics',
   observed_metrics:observed,post_age_hours:Math.round((seen-published)/360000)/10,
   impression_source_available:!isPersonal,provider_post_verified:true,
   enough_for_commercial_or_causal_learning:false,blog_or_instagram_inferred:false,
   learning_application_verified:false};
}
export function reconcileOriginalPublicationMeasurement(ob,post,snapshot,now){
 const proof=accept(ob,post,snapshot,now);
 if(!proof)return null;
 const old=ob?.metrics?.original_provider_metric_handoff;
 if(old?.source_event_id===proof.source_event_id)return null; // idempotent source event
 const oldTime=millis(old?.observed_at);
 if(Number.isFinite(oldTime)&&millis(proof.observed_at)<=oldTime)return null; // no stale overwrite
 return {
   measured_at:ob.measured_at||proof.observed_at,
   metrics:{...(ob.metrics||{}),original_provider_metric_handoff:proof},
   status:'LIVE_PROVEN', // never claim learn/experiment on a metrics receipt
   learned_at:ob.learned_at??null
 };
}
export function identifyOriginalPublicationHandoff(ob,posts,snapshots,now){
 if(ob?.status!=='LIVE_PROVEN'||!ob?.external_id)return {reason:'ORIGINAL_NOT_LIVE_PROVEN'};
 const expectedTenant=ob.channel==='linkedin_personal'?'canonical':'bedrijfsgeheugen';
 const exact=(posts||[]).filter(p=>p.tenant_id===expectedTenant&&p.channel_kind===ob.channel&&p.external_post_id===ob.external_id);
 if(exact.length!==1)return {reason:exact.length?'AMBIGUOUS_POST_IDENTITY':'OWNED_POST_MISSING'};
 const s=(snapshots||[]).filter(s=>s.tenant_id===expectedTenant&&s.post_id===exact[0].post_id)
   .sort((a,b)=>millis(b.observed_at)-millis(a.observed_at));
 for(const candidate of s){
   const proof=accept(ob,exact[0],candidate,now);
   if(!proof)continue;
   if(ob?.metrics?.original_provider_metric_handoff?.source_event_id===proof.source_event_id)
     return {reason:'ALREADY_RECONCILED'};
   const patch=reconcileOriginalPublicationMeasurement(ob,exact[0],candidate,now);
   if(patch)return {reason:'VERIFIED_MATURED_PROVIDER_METRIC',patch,source_event_id:candidate.source_event_id};
 }
 return {reason:'PROVIDER_METRIC_MISSING_OR_NOT_MATURED'};
}
