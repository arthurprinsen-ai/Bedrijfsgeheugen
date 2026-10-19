// A read-only readiness check cannot revoke a producer's claim or overwrite a
// newer verifier/worker result. A stale snapshot must be reread, never replayed.
export async function writeMediaPreflight(db,job,row){
  if(['CLAIMED','GENERATING'].includes(String(job?.status||''))||
     job?.asset_manifest?.automatic_generation_budget_exhausted===true){
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
