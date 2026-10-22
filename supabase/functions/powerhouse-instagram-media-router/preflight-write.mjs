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
