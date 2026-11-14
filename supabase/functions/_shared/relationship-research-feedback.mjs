// Pure, bounded attribution for the EXISTING relationship-public-research worker.
// A SERP snippet is a research CANDIDATE, not a proven current trigger or permission to send.
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const norm=v=>String(v??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const clean=(v,max)=>String(v??'').trim().slice(0,max);
function safeUrl(value){
 try{
  const u=new URL(String(value||''));
  if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||
     /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname))return null;
  return u.toString();
 }catch{return null}
}
export function researchSourceCandidate(researchAction,best,observedAt){
 const origin=researchAction?.evidence?.original_outreach_action_id;
 if(!UUID.test(String(origin||'')))return null;
 const company=norm(researchAction?.company_name||researchAction?.company_key);
 const title=clean(best?.title,240),summary=clean(best?.summary,500),sourceUrl=safeUrl(best?.url);
 const observed=Date.parse(observedAt);
 if(!company||!title||!sourceUrl||!Number.isFinite(observed)||
    observed>Date.now()+300000||!['post_merger_integration','investor_pe','buy_sell_ma',
      'new_management','growth','erp_afas_change','margin_cost_cashflow_pressure',
      'talent_shortage_key_person_risk','regulation','financing','turnaround',
      'ai_data_digitalisation'].includes(best?.trigger_type)||
    !norm(title+' '+summary+' '+sourceUrl).includes(company))return null;
 return Object.freeze({
  contract:'POWERHOUSE_RELATIONSHIP_SOURCE_CANDIDATE_V1',
  research_action_id:researchAction.action_id,
  original_outreach_action_id:origin,
  provider:'dataforseo-serp',
  source_url:sourceUrl,headline:title,summary,
  trigger_type:best.trigger_type,observed_at:new Date(observed).toISOString(),
  published_at:null,freshness_verified:false,source_page_independently_read:false,
  message_quality_approved:false,provider_send_authorized:false,
  status:'UNVERIFIED_SOURCE_CANDIDATE'
 });
}
export function researchRetryAt(observedAt,delayHours=24){
 const ts=Date.parse(observedAt);
 if(!Number.isFinite(ts)||!Number.isInteger(delayHours)||delayHours<12||delayHours>72)return null;
 return new Date(ts+delayHours*3600_000).toISOString();
}

/** Provider found no verified current company source. ACK the finding back
 * to the same original held email; do not change its send state. */
export function researchNoSourceFeedback(research,origin,observedAt,nextResearchAt){
 const ref=String(research?.evidence?.original_outreach_action_id||'');
 const now=Date.parse(observedAt),due=Date.parse(nextResearchAt);
 const originalEvidence=origin?.evidence||{};
 if(!UUID.test(ref)||ref!==String(origin?.action_id||'')||
   !UUID.test(String(research?.action_id||''))||
   String(origin?.person_key||'')!==String(research?.person_key||'')||
   String(origin?.company_key||'')!==String(research?.company_key||'')||
   !['prepared','waiting'].includes(origin?.status)||
   originalEvidence?.execution_gate?.reason!=='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'||
   !Number.isFinite(now)||!Number.isFinite(due)||due<now+12*3600000||
   due>now+72*3600000)return null;
 const outbound=originalEvidence?.autonomous_outbound||{};
 if(outbound?.provider_message_id||outbound?.needs_readback===true||
   outbound?.republish_forbidden===true||
   originalEvidence?.native_gmail_executor?.provider_message_id||
   originalEvidence?.provider_message_id||
   originalEvidence?.provider_ambiguity_quarantine?.external_resend_forbidden===true)
   return null;
 return Object.freeze({
   contract:'ORIGINAL_RELATIONSHIP_RESEARCH_RESULT_ACK_V2',
   research_action_id:research.action_id,original_outreach_action_id:ref,
   source_status:'NO_VERIFIED_SOURCE_RETRY',provider:'dataforseo-serp',
   provider_researched_at:new Date(now).toISOString(),
   next_research_at:new Date(due).toISOString(),
   correlation_id:research.action_id,
   recipient_send_authority_inferred:false,
   external_send_executed:false
 });
}
