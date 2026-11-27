/**
 * Same original SEO owner #105: reconcile finished money-page writer proof
 * against the original #175 -> ONE BRAIN/Heartbeat #140 source obligation.
 * Pure validation only. Caller writes ONLY the existing recommendation row
 * and performs independent readback. No scheduler, new queue or publication.
 */
export const SEO_ORIGINAL_DELIVERY_CRO_LINK='SEO_ORIGINAL_DELIVERY_CRO_LINK_V1';
const HEX64=/^[0-9a-f]{64}$/;
const URL_ORIGIN='https://www.bedrijfsgeheugen.nl';

export function verifyOriginalSeoDeliveryLink(obligation,recommendation){
  const issues=[];
  const o=obligation||{},r=recommendation||{},e=o.evidence||{},re=r.evidence||{};
  const ack=e.consumer_ack||{};
  const day=String(o.business_period||'');
  const revision=String(e.source_revision||'');
  if(o.obligation_type!=='GROWTH_SOURCE_DAILY_HANDOFF'||
     o.capability_id!=='website-seo-dataforseo-ai-cro'||
     o.business_entity!=='bedrijfsgeheugen.nl:bedrijfsgeheugen'||
     o.business_timezone!=='Europe/Amsterdam'||e.tenant_id!=='bedrijfsgeheugen'||
     !o.id) issues.push('ORIGINAL_SOURCE_IDENTITY_MISMATCH');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||r.run_date!==day)
    issues.push('ORIGINAL_SOURCE_DAY_MISMATCH');
  if(!HEX64.test(revision)||ack?.accepted!==true||
     ack?.consumed_revision!==revision||
     ack?.consumer!=='original powerhouse-content-orchestrator-140'||
     e.analysis?.source_revision!==revision)
    issues.push('ORIGINAL_SOURCE_ACK_REVISION_MISMATCH');
  if(r.target_channel!=='website'||r.recommendation_type!=='seo_money_page_update'||
     r.status!=='done'||re.contract!=='SEO_ORIGINAL_MONEY_OWNER_HANDOFF_V1'||
     re.action!=='UPDATE_MONEY_PAGE')
    issues.push('ORIGINAL_WEBSITE_ACTION_NOT_DONE');
  const route=String(re.canonical_owner||'');
  try{
    const u=new URL(route);
    if(u.origin!==URL_ORIGIN||u.search||u.hash||u.pathname==='/')
      issues.push('CANONICAL_ROUTE_INVALID');
  }catch{issues.push('CANONICAL_ROUTE_INVALID');}
  const releases=(Array.isArray(e.source_manifest)?e.source_manifest:[])
    .filter(x=>x.source_key==='website_release_readback'&&x.quality==='VERIFIED_PRODUCTION_RELEASE');
  const matching=releases.find(x=>
    Array.isArray(x.metrics?.routes)&&x.metrics.routes.includes(route)&&
    Number(x.metrics.http_status)===200&&
    x.metrics.source_release_proven===true&&
    typeof x.metrics.published_commit_ref==='string'&&
    x.metrics.published_commit_ref===re.owner_change_merge_sha&&
    typeof x.metrics.deploy_id==='string'&&x.metrics.deploy_id.length>=8);
  if(!matching)issues.push('ORIGINAL_SOURCE_RELEASE_ROUTE_SHA_NOT_MATCHED');
  if(re.state!=='WEBSITE_CHANGE_LIVE_PROVEN_METRICS_DUE'||
     re.public_page_http_status!==200||
     re.public_canonical_readback!==route||
     re.public_frisse_blik_cta_readback!==true||
     re.netlify_deploy_state!=='READY'||
     !/^[0-9a-f]{40}$/.test(String(re.owner_change_merge_sha||''))||
     !String(re.netlify_deploy_id||'').trim()||
     !String(re.public_provider_request_id||'').trim()||
     !String(re.owner_change_pr||'').startsWith('https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/'))
    issues.push('INDEPENDENT_PAGE_AND_CTA_READBACK_MISSING');
  if(issues.length)return {ok:false,stage:'WAIT_EXACT_ORIGINAL_SITE_PROOF',issues,
    recommendation_key:r.dedupe_key||null,original_obligation_id:o.id||null,
    source_revision:HEX64.test(revision)?revision:null};
  return {ok:true,stage:'SITE_ACTION_PROVEN_CRO_EXPERIMENT_AND_OUTCOME_DUE',issues:[],
    recommendation_key:r.dedupe_key,original_obligation_id:o.id,
    source_revision:revision,
    source_day:day,original_consumer:ack.consumer,
    original_ack_revision:ack.consumed_revision,
    canonical_owner:route,owner_change_merge_sha:re.owner_change_merge_sha,
    original_source_deploy_id:matching.metrics.deploy_id,
    independently_verified_page_deploy_id:re.netlify_deploy_id,
    independent_page_provider_request_id:re.public_provider_request_id,
    original_public_http_status:matching.metrics.http_status,
    source_release_observed_at:matching.observed_at||null,
    source_producer_observed_at:e.producer_observed_at||null,
    original_content_status:r.status,
    site_action_proven:true,
    cro_experiment_not_claimed:true,
    measured_causal_lift_not_claimed:true,
    paid_order_not_claimed:true,
    next_run_learning_not_claimed:true,
    next_owner:'original Powerhouse CRO/Experiment + ONE BRAIN/Heartbeat #140',
    next_action:'PRE_REGISTER_PROSPECTIVE_CONTROL_TREATMENT_AND_VERIFY_GSC_GA4_CTA_LEAD_ORDER',
    no_second_scheduler_or_writer:true
  };
}
export function sameOriginalSeoDeliveryLink(previous,next){
  return previous?.original_obligation_id===next?.original_obligation_id&&
    previous?.source_revision===next?.source_revision&&
    previous?.owner_change_merge_sha===next?.owner_change_merge_sha&&
    previous?.independent_page_provider_request_id===next?.independent_page_provider_request_id&&
    previous?.stage===next?.stage;
}
