const clean=value=>String(value??'').trim();
const calendarDay=value=>value instanceof Date?(Number.isFinite(value.getTime())?value.toISOString().slice(0,10):''):typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:'';
const stamp=value=>{const ms=value instanceof Date?value.getTime():Date.parse(String(value??''));return Number.isFinite(ms)?new Date(ms).toISOString():String(value??'');};
const sideEffectFlags=['provider_create_success','republish_forbidden','possible_provider_side_effect','provider_publication_ack_verified','provider_truth_verified'];
export function planBlogQualityRepair({runDate,artifact,decision,obligation,violations=[],nowMs=Date.now()}={}){
 const exact=calendarDay(artifact?.run_date)===runDate&&calendarDay(decision?.run_date)===runDate&&calendarDay(obligation?.publication_date)===runDate
  &&artifact?.channel==='blog'&&decision?.channel==='blog'&&obligation?.channel==='blog'&&obligation?.tenant_id==='canonical';
 const unsent=artifact?.status==='content_ready'&&decision?.decision==='publish'
  &&(['content_ready','scheduled'].includes(decision?.state)||(decision?.state==='decided'&&Date.parse(decision?.delivery_evidence?.blog_quality_repair?.claim_expires_at||'')<=nowMs))&&obligation?.status==='GENERATED'
  &&!clean(decision?.delivery_ref)&&!clean(obligation?.external_id)&&!obligation?.published_at&&!obligation?.live_proven_at
  &&Boolean(clean(decision?.updated_at))&&!(Date.parse(decision?.delivery_evidence?.generation_retry_after||'')>nowMs);
 const ambiguous=[obligation?.evidence,decision?.delivery_evidence,artifact?.generation_evidence]
  .some(e=>sideEffectFlags.some(flag=>e?.[flag]===true));
 return {eligible:exact&&unsent&&!ambiguous&&violations.length>0,violations:[...violations]};
}

// Same canonical writer only. A lost CAS never resets another worker's state.
export async function reopenRejectedBlog(db,runDate,validate){
 if(db.withBlogQualityLock)return db.withBlogQualityLock(runDate,locked=>reopenRejectedBlog(locked,runDate,validate));
 const [a,d,o]=await Promise.all([
  db.from('powerhouse_content_artifacts').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
  db.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
  db.from('content_publication_obligations').select('*').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','blog').maybeSingle()
 ]);
 if(a.error||d.error||o.error)throw new Error('BLOG_REPAIR_STATE_READ_FAILED');
 const violations=a.data?validate(a.data):[];
 const plan=planBlogQualityRepair({runDate,artifact:a.data,decision:d.data,obligation:o.data,violations});
 if(!plan.eligible)return {reopened:false};
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(a.data.body||'')));
 const rejectedHash=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const evidence={...d.data.delivery_evidence,blog_quality_repair:{contract:'same-obligation-unsent-blog-quality-repair-v1',token:crypto.randomUUID(),claim_expires_at:new Date(Date.now()+8*60000).toISOString(),recommendation_id:a.data.generation_evidence?.recommendation_id||null,rejected_body:String(a.data.body||''),rejected_updated_at:a.data.updated_at||null,rejected_body_sha256:rejectedHash,rejection_codes:violations,requested_at:new Date().toISOString(),previous_state:d.data.state,seo_slug:o.data.slug||a.data.generation_evidence?.seo_slug||null}};
 const changed=await db.from('powerhouse_channel_decisions').update({state:'decided',delivery_evidence:evidence,updated_at:new Date().toISOString()})
  .eq('run_date',runDate).eq('channel','blog').eq('decision','publish').eq('state',d.data.state)
  .eq('updated_at',d.data.updated_at).eq('delivery_ref',null).select('channel').maybeSingle();
 if(changed.error)throw new Error('BLOG_REPAIR_CAS_FAILED');
 return {reopened:Boolean(changed.data),claim:changed.data?evidence.blog_quality_repair:null,rejected_body_sha256:rejectedHash,violations};
}

export function canCommitBlogQualityRepair({runDate,artifact,decision,obligation,claim}={}){
 const exact=calendarDay(artifact?.run_date)===runDate&&calendarDay(decision?.run_date)===runDate&&calendarDay(obligation?.publication_date)===runDate
  &&artifact?.channel==='blog'&&decision?.channel==='blog'&&obligation?.channel==='blog'&&obligation?.tenant_id==='canonical';
 const safe=obligation?.status==='GENERATED'&&!obligation?.external_id&&!obligation?.published_at&&!obligation?.live_proven_at
  &&artifact?.status==='content_ready'&&decision?.state==='decided'&&decision?.decision==='publish'&&!decision?.delivery_ref
  &&![obligation?.evidence,decision?.delivery_evidence,artifact?.generation_evidence].some(e=>sideEffectFlags.some(f=>e?.[f]===true));
 const owner=Boolean(claim?.token)&&claim.token===decision?.delivery_evidence?.blog_quality_repair?.token
  &&claim.rejected_body===String(artifact?.body||'')&&stamp(claim.rejected_updated_at)===stamp(artifact?.updated_at)
  &&Boolean(claim.recommendation_id)&&claim.recommendation_id===artifact?.generation_evidence?.recommendation_id;
 return {eligible:Boolean(exact&&safe&&owner)};
}
export async function persistRepairedBlog(db,runDate,claim,artifact,decision){
 return db.withBlogQualityLock(runDate,async locked=>{
  const [a,d,o]=await Promise.all([
   locked.from('powerhouse_content_artifacts').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
   locked.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
   locked.from('content_publication_obligations').select('*').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','blog').maybeSingle()
  ]);
  if(a.error||d.error||o.error||!canCommitBlogQualityRepair({runDate,artifact:a.data,decision:d.data,obligation:o.data,claim}).eligible)throw new Error('BLOG_REPAIR_OWNERSHIP_OR_DELIVERY_CHANGED');
  const aw=await locked.from('powerhouse_content_artifacts').upsert(artifact);if(aw.error)throw new Error('BLOG_REPAIR_ARTIFACT_WRITE_FAILED');
  const dw=await locked.from('powerhouse_channel_decisions').update(decision).eq('run_date',runDate).eq('channel','blog').eq('state','decided');if(dw.error)throw new Error('BLOG_REPAIR_DECISION_WRITE_FAILED');
  return {error:null};
 });
}
