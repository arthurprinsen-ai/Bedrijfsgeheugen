/**
 * Original #177 social provider observer: strictly stage a connected, read-only
 * Windsor LinkedIn ORGANIZATION source read into the EXISTING source spine.
 * No scheduler, sender, post, causal claim or alternate consumer is created.
 * The original independent owner/post proof and 24h+ metrics gates apply later.
 */
const URN=/^urn:li:(?:share|ugcPost):[0-9]{10,25}$/;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const metric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:
  typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v)?Number(v):null;
const date=v=>DAY.test(String(v||''))?String(v):null;
const link=urn=>'https://www.linkedin.com/feed/update/'+urn;
const sameDay=(a,b)=>a===b; // Never infer a different source publication date.
const isExactOriginalProof=(p,organizationUrn)=>p?.tenant_id==='canonical'
  &&p.channel==='linkedin_company'&&p.status==='LIVE_PROVEN'
  &&p.evidence?.provider_truth_verified===true
  &&p.evidence?.author_urn===organizationUrn
  &&p.evidence?.linkedin_readback?.author===organizationUrn
  &&p.evidence?.linkedin_readback?.id===p.external_id
  &&URN.test(String(p.external_id||''))
  &&date(p.publication_date)!==null
  &&Number.isFinite(Date.parse(String(p.live_proven_at||'')));
export function stageOriginalWindsorCompanySources({
 postRows=[],accountRows=[],publicationProofs=[],slotDay,
 observedAt,organizationId='18234216',maxRows=40
}={}){
 if(![postRows,accountRows,publicationProofs].every(Array.isArray))
   throw new Error('WINDSOR_SOURCE_ARRAYS_REQUIRED');
 if(!DAY.test(String(slotDay||''))||!Number.isFinite(Date.parse(String(observedAt||''))))
   throw new Error('WINDSOR_SOURCE_CLOCK_INVALID');
 if(organizationId!=='18234216')throw new Error('WINDSOR_ORGANIZATION_OWNER_UNVERIFIED');
 if(postRows.length>=maxRows||postRows.length>40||accountRows.length>7)
   throw new Error('WINDSOR_SOURCE_TRUNCATED_RETRY_BOUNDED_QUERY');
 const org='urn:li:organization:'+organizationId;
 const proofs=new Map(publicationProofs.filter(p=>isExactOriginalProof(p,org)).map(p=>[p.external_id,p]));
 const seen=new Set(),staged=[];
 let rejected=0;
 for(const row of postRows){
   const urn=String(row?.post_id||''),id=urn.split(':').at(-1);
   const published=date(row?.date),time=date(String(row?.share_published_time||'').slice(0,10));
   const proof=proofs.get(urn);
   if(!URN.test(urn)||seen.has(urn)||row?.share_owner!==org
     ||String(row?.share_id||'')!==id||!proof
     ||!published||!time||!sameDay(published,time)
     ||!sameDay(published,proof.publication_date)
     ||String(row?.share_url||'')!==link(urn)){
     rejected++;continue;
   }
   const impressions=metric(row.share_impression_count),clicks=metric(row.share_clicks_count),
    likes=metric(row.share_like_count),comments=metric(row.share_comment_count);
   if([impressions,clicks,likes,comments].some(v=>v===null)){rejected++;continue;}
   const shares=metric(row.share_count),videoViews=metric(row.share_video_views);
   seen.add(urn);
   const providerUrl=link(urn);
   staged.push({
     tenant_id:'bedrijfsgeheugen',metric_date:slotDay,
     source_key:'linkedin_company_post:'+urn,
     quality:'PROVIDER_OBSERVED_UNLINKED',source_observed_at:observedAt,
     checked_at:observedAt,
     metrics:{post_id:urn,share_id:id,share_url:providerUrl,
       share_impression_count:impressions,share_clicks_count:clicks,
       share_like_count:likes,share_comment_count:comments,
       ...(shares===null?{}:{share_count:shares}),
       ...(videoViews===null?{}:{share_video_views:videoViews})},
     evidence:{source:'linkedin_organic',provider:'windsor.ai',
       account:organizationId,post_id:urn,share_id:id,
       share_url:providerUrl,provider_metric_date:published,
       source_fetched_at:observedAt,
       original_author_verified:true,
       original_publication_proof_revision:String(proof.live_proven_at),
       origin:'original-bg-social-metrics-sync-cron-177',
       semantics:'PROVIDER_OBSERVED_UNLINKED_UNTIL_ORIGINAL_INDEPENDENT_JOIN'}
   });
 }
 // Account aggregates are separately provider sourced, never synthesized by
 // adding post impressions; the account's ID is constrained by the caller's
 // exact select_accounts=18234216 AND by any present provider organization_id.
 let aggregate=null;
 const matching=accountRows.filter(row=>date(row?.date)===slotDay
   &&(row.organization_id==null||String(row.organization_id)===organizationId)
   &&metric(row.account_analytics_impression_count)!==null);
 if(matching.length===1){
   const row=matching[0];
   aggregate={
     tenant_id:'bedrijfsgeheugen',metric_date:slotDay,
     source_key:'linkedin_company_account_provider',quality:'PROVIDER_OBSERVED',
     source_observed_at:observedAt,checked_at:observedAt,
     metrics:{impressions:metric(row.account_analytics_impression_count),
       ...(metric(row.account_analytics_click_count)===null?{}:
         {clicks:metric(row.account_analytics_click_count)}),
       ...(metric(row.account_analytics_comment_count)===null?{}:
         {comments:metric(row.account_analytics_comment_count)}),
       ...(metric(row.account_analytics_share_count)===null?{}:
         {shares:metric(row.account_analytics_share_count)})},
     evidence:{source:'linkedin_organic',provider:'windsor.ai',
       connector:'linkedin_organic',account_id:organizationId,
       source_fetched_at:observedAt,provider_date:slotDay,
       original_provider_account_bound:true,
       origin:'original-bg-social-metrics-sync-cron-177',
       semantics:'ACCOUNT_DESCRIPTIVE_NOT_POST_OR_CAUSAL_PROOF'}
   };
 }
 return {source_rows:staged,account_row:aggregate,
   provider_rows_examined:postRows.length,original_proof_count:proofs.size,
   source_rows_accepted:staged.length,rejected,
   provider_delivery_proven:false,causal_improvement_proven:false};
}


/**
 * Never promote SOURCE->METRICS->BRAIN health from a connected-app one-off
 * recovery. Linked snapshots can be true while the ORIGINAL autonomous #177
 * Vault-authenticated provider call is still denied (HTTP 403). All gates
 * must refer to the same authorized source owner and original consumer.
 */
export function originalCompanySourceProviderHealth({
 sourceRefresh,companyState,companyMetricLink,companyRegistry
}={}){
 return sourceRefresh?.state==='PROVIDER_ACCOUNT_SOURCE_REFRESHED_AND_STAGED'
   &&sourceRefresh?.original_cron===177
   &&sourceRefresh?.provider==='windsor.ai'
   &&sourceRefresh?.authorized_account==='18234216'
   &&sourceRefresh?.posts_staged>0
   &&sourceRefresh?.account_source_staged===true
   &&sourceRefresh?.verified_daily_readback>=sourceRefresh.posts_staged
   &&companyState?.state==='WINDSOR_FRESH'
   &&companyMetricLink?.state==='VERIFIED_OWNED_COMPANY_PROVIDER_METRICS_LINKED'
   &&companyMetricLink?.linked>0
   &&companyRegistry?.eligible>0;
}
