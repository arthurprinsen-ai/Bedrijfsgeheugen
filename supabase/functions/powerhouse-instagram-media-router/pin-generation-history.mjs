// Original exclusive Mira media owner: persist one asynchronous OpenArt history
// immediately after generation submission. This is NOT an additional worker,
// a creator, a publisher, identity proof, or an external provider attestation.
const clean=x=>String(x??'').trim();
export const MIRA_ORIGINAL_GENERATION_RECEIPT_CONTRACT='mira-original-openart-claimed-generation-receipt-v1';
export const MIRA_ORIGINAL_MASTER_ID='Yjqu4D7v76HABNPmQPj1';
export const MIRA_ORIGINAL_MASTER_URL='https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg';
export const MIRA_ORIGINAL_PROJECT_ID='rUF5anXD47gVokckYjf9';

export function assessMiraOriginalGenerationReceipt({runDate,localDate,job,ob,winner,lineage,resolved,input,postType}={}){
 const refusal=(code)=>({ok:false,code,contract:MIRA_ORIGINAL_GENERATION_RECEIPT_CONTRACT,
   approved_for_publish:false,actual_media_verified:false});
 const date=clean(runDate),now=clean(localDate),body=input||{},manifest=job?.asset_manifest||{};
 const next=/^20\d\d-\d\d-\d\d$/.test(now)
   ?new Date(Date.parse(now+'T00:00:00Z')+86400000).toISOString().slice(0,10):'';
 if(!/^20\d\d-\d\d-\d\d$/.test(date)||![now,next].includes(date))
  return refusal('ORIGINAL_CURRENT_OR_NEXT_DAY_ONLY');
 if(clean(job?.publication_date)!==date||clean(ob?.publication_date)!==date)
  return refusal('ORIGINAL_MEDIA_OBLIGATION_DAY_MISMATCH');
 if(postType!=='reel'||clean(job?.channel)!=='instagram'||clean(job?.tenant_id)!=='canonical'
    ||clean(job?.required_provider)!=='openart'||clean(job?.selected_provider)!=='openart'
    ||!Array.isArray(job?.allowed_providers)||!job.allowed_providers.includes('openart'))
  return refusal('ORIGINAL_EXCLUSIVE_OPENART_MEDIA_JOB_REQUIRED');
 if(clean(winner?.run_date)!==date||clean(lineage?.run_date)!==date||
    !['WINNER_FROZEN','LIVE_PROVEN'].includes(clean(lineage?.state)))
  return refusal('ORIGINAL_FROZEN_WINNER_REQUIRED');
 const id=clean(winner?.recommendation_id);
 if(!id||clean(lineage?.winner_recommendation_id)!==id||
    clean(resolved?.winner_recommendation_id)!==id||
    clean(manifest.daily_winner_recommendation_id)!==id||
    clean(manifest.recommendation_id)!==id||
    clean(body.recommendation_id)!==id)
  return refusal('ORIGINAL_SOURCE_WINNER_MATCH_REQUIRED');
 if(clean(resolved?.kind)!=='approved_frozen_library_mapping'||
    !clean(resolved?.problem?.scene)||
    clean(body.scene)!==clean(resolved.problem.scene)||
    clean(body.canonical_problem_id)!==clean(resolved.problem.id))
  return refusal('ORIGINAL_APPROVED_SCENE_REQUIRED');
 if(clean(job?.id)!==clean(body.job_id)||!clean(job?.id)||
    clean(manifest.claimed_by)!==clean(body.worker)||!clean(body.worker)||
    !clean(manifest.claimed_at))
  return refusal('ORIGINAL_PRODUCER_CAS_OWNER_MISMATCH');
 if(job?.republish_forbidden===true||ob?.evidence?.republish_forbidden===true||
    clean(ob?.external_id)||ob?.live_proven_at||
    !['BLOCKED','PLANNED'].includes(clean(ob?.status))||
    coalesceActiveVeto(ob))
  return refusal('ORIGINAL_PUBLICATION_OR_EDITORIAL_VETO');
 if(clean(manifest.openart_project_id)!==MIRA_ORIGINAL_PROJECT_ID||
    clean(body.openart_project_id)!==MIRA_ORIGINAL_PROJECT_ID||
    clean(body.openart_reference_id)!==MIRA_ORIGINAL_MASTER_ID||
    clean(body.openart_reference_url)!==MIRA_ORIGINAL_MASTER_URL||
    clean(body.model)!=='wan3-0'||clean(body.mode)!=='element2video')
  return refusal('ORIGINAL_PROJECT_MASTER_MODEL_MISMATCH');
 const quoted=Number(body.quoted_credits);
 if(!Number.isFinite(quoted)||quoted<=0||quoted>640||
    clean(body.provider_status)==='FAILED')
  return refusal('ORIGINAL_CREDIT_QUOTE_OR_PROVIDER_STATUS_UNVERIFIED');
 const history=clean(body.openart_history_id);
 if(!/^[A-Za-z0-9]{8,64}$/.test(history))return refusal('OPENART_HISTORY_ID_INVALID');
 if(clean(body.asset_url)||clean(body.media_proof_id))
  return refusal('MEDIA_NOT_VERIFIED_AT_GENERATION_RECEIPT');
 const prior=clean(manifest.openart_history_id);
 if(prior&&prior!==history)return refusal('ORIGINAL_HISTORY_IMMUTABLE_CONFLICT');
 if(job?.status==='GENERATING'&&prior===history){
  return {ok:true,idempotent:true,contract:MIRA_ORIGINAL_GENERATION_RECEIPT_CONTRACT,
    history_id:history,job_id:clean(job.id),approved_for_publish:false,actual_media_verified:false,
    next_action:'Resume same pinned OpenArt history; never charge another generation.'};
 }
 if(job?.status!=='CLAIMED'||Number(job?.attempts)!==1||
    clean(manifest.asset_url)||prior||job?.last_error)
  return refusal('ORIGINAL_UNCLAIMED_OR_ALREADY_SPENT_JOB');
 return {ok:true,idempotent:false,contract:MIRA_ORIGINAL_GENERATION_RECEIPT_CONTRACT,
   history_id:history,job_id:clean(job.id),claimed_by:clean(body.worker),
   quoted_credits:quoted,approved_for_publish:false,actual_media_verified:false,
   next_action:'Read original OpenArt history status and exact provider output; no duplicate generation.'};
}
function coalesceActiveVeto(ob){
 return String(ob?.evidence?.veto?.active??'false')==='true'||
   String(ob?.evidence?.mira_source_veto_active??'false')==='true';
}
