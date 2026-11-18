// Original media-router's one-job, bounded resumption after vision provider transport failure.
// No OpenArt generation, alternate verifier, publication, duplicated media job or face approval.
// This module only evaluates immutable job evidence and a deterministic cooldown plan.
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL} from '../_shared/mira-canonical-face.mjs';

export const MIRA_EXACT_VERIFICATION_RESUME='mira-original-exact-video-provider-retry-v1';
const MAX_ATTEMPTS=3;
const ORIGINAL_PROJECT='rUF5anXD47gVokckYjf9';
const OPENART_MP4=/^https:\/\/cdn\.openart\.ai\/openart-ai\/production\/[^?#]+\.mp4$/;
const historyOk=x=>/^[A-Za-z0-9]{8,64}$/.test(String(x||''));
const dateMs=v=>{const n=Date.parse(String(v||''));return Number.isFinite(n)?n:null;};
const no=x=>Object.freeze({kind:'NOT_APPLICABLE',reason:x});
const hold=(reason,extra={})=>Object.freeze({kind:'HOLD',reason,...extra});
const transientError=e=>['MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE','MIRA_FRAME_IDENTITY_VERDICT_UNAVAILABLE','MIRA_FRAME_PROOF_TRANSPORT_FAILURE'].includes(String(e||''));

export function planMiraExactVideoVerificationResume({runDate,localDate,job,ob,resolved,readyProviders=[],now=Date.now()}={}){
 const date=String(runDate||''),today=String(localDate||'');
 const m=job?.asset_manifest||{};
 if(date!==today||!/^20\d{2}-\d{2}-\d{2}$/.test(date))return no('NOT_TODAYS_ORIGINAL_JOB');
 if(resolved?.kind!=='approved_frozen_library_mapping'||!resolved.problem?.id||!resolved.problem?.scene)
   return no('NOT_FROZEN_LIBRARY_PROBLEM');
 const winner=String(resolved.winner_recommendation_id||'');
 const hist=String(m.openart_history_id||''),url=String(m.asset_url||'');
 const original=job?.tenant_id==='canonical'&&job?.publication_date===date&&job?.channel==='instagram'
  &&job?.post_type==='reel'&&job?.required_provider==='openart'&&job?.selected_provider==='openart'
  &&Array.isArray(job.allowed_providers)&&job.allowed_providers.includes('openart')
  &&job?.republish_forbidden===false&&Number(job?.attempts)===1
  &&['VERIFYING','WAITING_PROOF'].includes(String(job?.status||''))
  &&winner&&m.daily_winner_recommendation_id===winner&&m.source_recommendation_id===winner
  &&m.openart_project_id===ORIGINAL_PROJECT&&historyOk(hist)&&OPENART_MP4.test(url)
  &&m.identity_reference_id===MIRA_MASTER_REFERENCE_ID&&m.generation_mode==='element2video'
  &&ob?.tenant_id==='canonical'&&ob?.publication_date===date&&ob?.channel==='instagram'
  &&ob?.status==='BLOCKED'&&!ob?.external_id&&!ob?.live_proven_at
  &&ob?.evidence?.republish_forbidden!==true
  &&String(ob?.evidence?.veto?.active??'false')!=='true'
  &&ob?.evidence?.mira_source_veto_active!==true
  &&job?.proof_manifest?.exact_final_media_proven!==true;
 if(!original)return no('ORIGINAL_PROOF_OR_SOURCE_NOT_ELIGIBLE');
 if(!readyProviders.includes('openart'))return hold('ORIGINAL_OPENART_CONNECTION_NOT_READY');
 const state=String(job.status);
 const errors=state==='VERIFYING'? !job.last_error
  : (!job.last_error&&m.vision_resume_contract===MIRA_EXACT_VERIFICATION_RESUME)||transientError(job.last_error);
 if(!errors)return hold('MEASURED_OR_UNKNOWN_REJECTION_REQUIRES_ORIGINAL_REVIEW');
 const used=Number(m.vision_retry_count||0);
 if(!Number.isInteger(used)||used<0||used>MAX_ATTEMPTS)return hold('INVALID_RETRY_LEDGER');
 if(used>=MAX_ATTEMPTS)return Object.freeze({kind:'EXHAUSTED',reason:'SAME_ASSET_VERIFICATION_RETRY_LIMIT',attempts:used});
 const nowMs=typeof now==='number'?now:dateMs(now);
 if(nowMs===null||!Number.isFinite(nowMs))return hold('CLOCK_UNAVAILABLE');
 // First real OpenArt completion needs 30 minutes of provider recovery before
 // a new billable *vision* call. Subsequent attempts use durable exponential delay.
 const initialDue=dateMs(m.completed_at);
 if(initialDue===null)return hold('COMPLETION_RECEIPT_REQUIRED');
 const nextDue=dateMs(m.vision_retry_after)??(initialDue+30*60_000);
 if(nowMs<nextDue)return hold('COOLDOWN',{due_at:new Date(nextDue).toISOString(),attempts:used});
 const nextCount=used+1;
 const delayMs=(30*2**(nextCount-1))*60_000;
 const retryAfter=new Date(nowMs+delayMs).toISOString();
 const manifest={
  asset_url:url,provider:'openart',media_type:'video',duration:8,
  openart_history_id:hist,openart_project_id:ORIGINAL_PROJECT,
  openart_reference_id:MIRA_MASTER_REFERENCE_ID,openart_reference_url:MIRA_MASTER_REFERENCE_URL,
  generation_mode:'element2video',
  recommendation_id:winner,daily_winner_recommendation_id:winner,
  canonical_problem_id:resolved.problem.id,scene:resolved.problem.scene
 };
 return Object.freeze({kind:'RETRY_EXACT_MEDIA',contract:MIRA_EXACT_VERIFICATION_RESUME,
  attempts:nextCount,retry_after:retryAfter,history_id:hist,job_id:job.id,asset_manifest:manifest});
}

/**
 * Preserve one completed, independently failed original verifier result using
 * the *database-returned* timestamp from the claim's RETURNING row.
 * The media-job trigger replaces incoming updated_at with its own now(), so
 * using the caller's timestamp silently matches zero rows in PostgREST.
 * A concurrent real PASS/rejection wins: no overwrite and no false green.
 */
export async function recordMiraExactVerificationFailure({
  db,jobId,claimUpdatedAt,code,nextAction,now=new Date().toISOString()
}={}){
 const allowed=['MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE','MIRA_EXACT_VIDEO_PROOF_NEEDS_REVIEW'];
 if(!db||!/^[0-9a-f-]{36}$/i.test(String(jobId||''))||
    !dateMs(claimUpdatedAt)||!allowed.includes(String(code||'')))
   return Object.freeze({kind:'INVALID_RECOVERY_RECEIPT'});
 const {data,error}=await db.from('powerhouse_instagram_media_jobs_v1')
   .update({last_error:code,next_action:String(nextAction||'').slice(0,450),updated_at:now})
   .eq('id',jobId).eq('status','WAITING_PROOF')
   .eq('updated_at',claimUpdatedAt).is('last_error',null)
   .select('id').maybeSingle();
 if(error)return Object.freeze({kind:'WRITE_FAILED',error_code:String(error.code||'unknown').slice(0,30)});
 if(!data)return Object.freeze({kind:'CONCURRENT_RESULT_PRESERVED'});
 return Object.freeze({kind:'RECORDED',job_id:jobId});
}
