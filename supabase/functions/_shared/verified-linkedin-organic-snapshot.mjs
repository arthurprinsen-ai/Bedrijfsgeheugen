/** Three independently attested sources are needed to connect organic
 * LinkedIn account-day/post reporting to a verified company publication.
 * This is NOT an event-time 24/48/72h snapshot or conversion proof. */
const URN=/^urn:li:(?:share|ugcPost):\d{10,25}$/;
const ORG=/^urn:li:organization:\d{3,25}$/;
const numeric=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:
  typeof value==='string'&&/^\d+(\.\d+)?$/.test(value)?Number(value):null;
const iso=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?new Date(n).toISOString():null;};
export function verifiedLinkedinCompanySourceSnapshot({source,post,obligation,now=new Date()}={}){
 if(!source||!post||!obligation)return null;
 const at=now instanceof Date?now.getTime():Date.parse(now);
 if(!Number.isFinite(at))throw new Error('INVALID_PROVIDER_SNAPSHOT_CLOCK');
 const urn=String(source.evidence?.provider_post_urn||'');
 const org=String(obligation.evidence?.author_urn||'');
 const m=source.metrics||{};
 const e=source.evidence||{};
 if(!URN.test(urn)||!ORG.test(org)||org!=='urn:li:organization:'+String(e.account_id||''))return null;
 if(source.tenant_id!=='bedrijfsgeheugen'||source.source_key!=='linkedin_company_post:'+urn||
    source.quality!=='PROVIDER_OBSERVED_UNLINKED')return null;
 if(e.source!=='windsor.ai'||e.connector!=='linkedin_organic'||e.provider!=='linkedin'||
    e.scope!=='post-snapshot'||e.provider_post_urn!==urn||m.post_id!==urn)return null;
 if(obligation.tenant_id!=='canonical'||obligation.channel!=='linkedin_company'||
    obligation.status!=='LIVE_PROVEN'||obligation.external_id!==urn||
    obligation.evidence?.provider_truth_verified!==true||
    obligation.evidence?.linkedin_readback?.author!==org||
    obligation.evidence?.linkedin_readback?.id!==urn)return null;
 if(post.tenant_id!=='bedrijfsgeheugen'||post.platform!=='linkedin'||
    post.channel_kind!=='linkedin_company'||post.external_post_id!==urn)return null;
 const observed=iso(source.source_observed_at),published=iso(post.published_at),live=iso(obligation.live_proven_at);
 if(!observed||!published||!live)return null;
 const obsTime=Date.parse(observed),pubTime=Date.parse(published),liveTime=Date.parse(live);
 if(pubTime>liveTime+300000||pubTime>obsTime||obsTime>at+300000||pubTime>at+300000||
    at-obsTime>14*86400000||at-pubTime>35*86400000)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e.provider_date||'')))return null;
 const measurements={};
 for(const [field,key] of Object.entries({
   share_impression_count:'impressions',share_like_count:'likes',
   share_comment_count:'comments',share_clicks_count:'clicks',
   share_share_count:'shares',share_video_views:'video_views'
 })){
    if(Object.hasOwn(m,field)){
      const value=numeric(m[field]);
      if(value===null)return null;
      measurements[key]=value;
    }
 }
 if(Object.keys(measurements).length===0)return null;
 const id='windsor-linkedin-company:'+urn+':'+observed;
 return {
   tenant_id:'bedrijfsgeheugen',post_id:post.post_id,
   snapshot_id:id,source_event_id:id,
   observed_at:observed,age_hours:(obsTime-pubTime)/3600000,
   source:'windsor-linkedin-organic-company',
   // Windsor reports a provider-date slice, not a verified lifetime or exact
   // window rate. Exclude from the 24/48/72h causal promotion lane.
   data_quality:'OBSERVED_PARTIAL_SCOPE',
   metrics:{...measurements,provider_report_date:String(e.provider_date),
     metric_scope:'LINKEDIN_ORGANIC_POST_PROVIDER_DATE_NOT_LIFETIME',
     exact_age_window_unverified:true,verified_account_urn:org,
     attribution_status:'VERIFIED_POST_AND_ORGANIZATION_ONLY',
     customer_conversion_observed:false}
 };
}
export function verifiedLinkedinCompanySourceBatch({sources=[],posts=[],obligations=[],now=new Date(),limit=25}={}){
 const capped=Math.min(25,Math.max(1,Math.floor(Number(limit)||25)));
 const byPost=new Map(posts.filter(x=>x?.external_post_id).map(x=>[x.external_post_id,x]));
 const byProof=new Map(obligations.filter(x=>x?.external_id).map(x=>[x.external_id,x]));
 const seen=new Set(),out=[];
 for(const source of sources){
   const urn=source?.evidence?.provider_post_urn;
   const row=verifiedLinkedinCompanySourceSnapshot({source,post:byPost.get(urn),obligation:byProof.get(urn),now});
   if(!row||seen.has(row.source_event_id))continue;
   seen.add(row.source_event_id);out.push(row);
   if(out.length>=capped)break;
 }
 return out;
}
