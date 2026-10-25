// A read-only readiness check cannot revoke a producer's claim or overwrite a
// newer verifier/worker result. A stale snapshot must be reread, never replayed.
const sameValue = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
export async function writeMediaPreflight(db,job,row){
  if(['CLAIMED','GENERATING'].includes(String(job?.status||''))||
     job?.asset_manifest?.automatic_generation_budget_exhausted===true){
    return {kind:'preserved',status:job.status};
  }
  // Repeated readiness polls with identical business state must not write or
  // increment attempts. Compare all material fields, excluding updated_at.
  if (job?.id
    && job.status === row.status
    && job.post_type === row.post_type
    && job.required_provider === row.required_provider
    && job.selected_provider === row.selected_provider
    && job.provider_connection_state === row.provider_connection_state
    && job.last_error === row.last_error
    && job.next_action === row.next_action
    && job.republish_forbidden === row.republish_forbidden
    && job.attempts === row.attempts
    && sameValue(job.asset_manifest,row.asset_manifest)
    && sameValue(job.proof_manifest,row.proof_manifest)) {
    return {kind:'preserved',status:job.status};
  }
  if(job?.id&&!job.updated_at)return {kind:'stale'};
  const table=db.from('powerhouse_instagram_media_jobs_v1');
  const query=job?.id
    ?table.update(row).eq('id',job.id).eq('updated_at',job.updated_at)
    :table.insert(row);
  const {data,error}=await query.select('id').maybeSingle();
  if(error?.code==='23505'||(!error&&!data))return {kind:'stale'};
  if(error)return {kind:'failed',code:String(error.code||'MEDIA_PREFLIGHT_WRITE_FAILED')};
  return {kind:'applied'};
}


// A readiness poll is not evidence that an explicit video-frame rejection was
// repaired. Preserve its precise error and next action until NEW proof succeeds.
const proofReject = error => /(?:VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH|MIRA_VIDEO_FRAME_CANONICAL_FACE_MISMATCH|MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED|MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED)/.test(String(error||''));
export function retainMediaProofFailure(job,ob,row){
  if(row.status!=='WAITING_PROOF'||!row.asset_manifest?.asset_url)return row;
  const reason=[job?.last_error,ob?.last_error].find(proofReject);
  if(!reason)return row;
  const nextAction=proofReject(job?.last_error)
    ? String(job?.next_action||row.next_action)
    : String(ob?.next_action||row.next_action);
  return {...row,last_error:reason,next_action:nextAction};
}

// Writes only to the SAME canonical job and obligation with CAS/version guards;
// never rewrites the selected asset, silently retries a rejected hash or promotes
// an unverified video. The full frame/hash verdict stays in canonical evidence.
export async function recordMediaProofRejection(db,{job,ob,code,position,historyId,confidence}){
  if(!['VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH','MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED'].includes(code)||!job?.id||
     job.status!=='WAITING_PROOF'||!job.updated_at||ob?.external_id)
    return {kind:'ignored'};
  const temporal=code==='MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED';
  const pos=temporal?'temporal':String(position||'unknown').slice(0,16).replace(/[^a-z]/gi,'');
  const hist=String(historyId||'unknown').slice(0,60).replace(/[^a-z0-9]/gi,'');
  const score=Number(confidence);
  const admissibleScore=Number.isFinite(score)&&score>=0&&score<=1;
  // Never turn a failed/timeout verifier transport into a fake quality verdict.
  if(temporal&&(confidence===null||confidence===undefined||confidence===''||!admissibleScore))return {kind:'ignored'};
  const face=admissibleScore?score.toFixed(3):'unknown';
  const last_error=temporal
    ? 'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence='+face+':openart='+hist
    : 'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:'+pos+':face='+face+':openart='+hist;
  const next_action=temporal
    ? 'Independent temporal continuity verdict below 0.900; reject this exact OpenArt history and keep original frozen winner. Produce a genuinely different rights-cleared candidate with more natural continuous motion, then repeat all frame, temporal and publisher checks. No resend, override or threshold change.'
    : 'Exact Mira video failed canonical face verification. Retain rejection evidence; create or select a genuinely different licensed OpenArt candidate, then verify all three frames at >=0.94 before canonical publishing. No duplicate dispatch.';
  const updated_at=new Date().toISOString();
  const write=await db.from('powerhouse_instagram_media_jobs_v1')
    .update({last_error,next_action,updated_at})
    .eq('id',job.id).eq('status','WAITING_PROOF').eq('updated_at',job.updated_at)
    .select('id').maybeSingle();
  if(write.error)return {kind:'failed',code:String(write.error.code||'MEDIA_PROOF_DIAGNOSTIC_WRITE_FAILED')};
  if(!write.data)return {kind:'stale'};
  // Obligation is a read-model diagnostic, NOT permission to publish.
  if(['BLOCKED','FAILED'].includes(ob?.status)&&ob?.updated_at){
    const other=await db.from('content_publication_obligations')
      .update({last_error,next_action,updated_at})
      .eq('tenant_id','canonical').eq('publication_date',job.publication_date)
      .eq('channel','instagram').eq('updated_at',ob.updated_at)
      .eq('status',ob.status).is('external_id',null);
    if(other.error)return {kind:'partial',code:String(other.error.code||'OBLIGATION_DIAGNOSTIC_WRITE_FAILED')};
  }
  // Preserve every genuinely new rejected OpenArt generation in the ONE canonical
  // Brain failure register. The occurrence key is stable across retries and chats;
  // repeated observations cannot inflate the incident count.
  const history=String(historyId||'').trim();
  if(history){
    const occurrence='router:openart:'+history+':instagram:'+job.publication_date+':'+pos;
    const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(occurrence)));
    const payloadSha256=Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');
    try {
      const {error:brainError}=await db.rpc('brain_observe_failure',{
        p_occurrence_id:occurrence,
        p_fingerprint:temporal
          ? 'powerhouse|instagram-mira|temporal-continuity-below-090|20261025-v1'
          : 'powerhouse|instagram-mira|video-frame-identity-below-094|20261022-v1',
        p_payload_sha256:payloadSha256,
        p_evidence:{
          source:'powerhouse-instagram-media-router',publication_date:String(job.publication_date),
          provider:'openart',openart_history_id:history,frame_position:pos,
          ...(temporal
            ? {temporal_confidence:score,minimum_required_temporal_confidence:0.90}
            : {face_identity_confidence:admissibleScore?score:null,minimum_required_face_confidence:0.94}),
          outcome:code,
          media_job_id:String(job.id),publication_verified:false,
          regression_ref:'tests/brain-mira-preflight-verifier-rejection-retention.test.mjs'
        }
      });
      if(brainError)return {kind:'partial',code:'BRAIN_FAILURE_REGISTRY_WRITE_FAILED',last_error};
    }catch{
      return {kind:'partial',code:'BRAIN_FAILURE_REGISTRY_WRITE_FAILED',last_error};
    }
  }
  return {kind:'applied',last_error};
}
