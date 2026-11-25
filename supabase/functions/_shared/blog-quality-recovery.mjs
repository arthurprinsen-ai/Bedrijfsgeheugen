const clean=value=>String(value??'').trim();
const calendarDay=value=>value instanceof Date?(Number.isFinite(value.getTime())?value.toISOString().slice(0,10):''):typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:'';
const stamp=value=>{const ms=value instanceof Date?value.getTime():Date.parse(String(value??''));return Number.isFinite(ms)?new Date(ms).toISOString():String(value??'');};
const sideEffectFlags=['provider_create_success','republish_forbidden','possible_provider_side_effect','provider_publication_ack_verified','provider_truth_verified'];

const QUALITY_REASONS=new Set(['UNCLEAR_READER_LANGUAGE','UNSUPPORTED_PRODUCT_ACTION','UNVERIFIED_OFFER_CLAIM']);
export function normalizeBlogQualityReview(review,runDate,channelScope){
 if(review===undefined||review===null)return null;
 const invalid=()=>{throw new Error('BLOG_QUALITY_REVIEW_INVALID');};
 if(channelScope!=='blog'||review?.contract!=='blog-reader-quality-review-v1'||review?.run_date!==runDate||review?.channel!=='blog'||!/^\d{4}-\d{2}-\d{2}$/.test(runDate||'')||!/^[a-f0-9]{64}$/.test(review?.expected_body_sha256||''))invalid();
 const codes=review.reason_codes,notes=clean(review.notes),sources=review.sources??[];
 if(typeof review.notes!=='string'||!Array.isArray(codes)||!codes.length||codes.length>3||codes.some(x=>!QUALITY_REASONS.has(x))||new Set(codes).size!==codes.length||notes.length<20||notes.length>2000||!Array.isArray(sources)||sources.length>3)invalid();
 const facts=sources.map(source=>{
  let u;try{u=new URL(source?.url);}catch{invalid();}
  const title=clean(source?.title),fact=clean(source?.facts),observed=clean(source?.observed_at);
  if(['url','title','facts','observed_at'].some(key=>typeof source?.[key]!=='string')||u.protocol!=='https:'||u.username||u.password||title.length<3||title.length>150||fact.length<20||fact.length>1000||!Number.isFinite(Date.parse(observed)))invalid();
  return {url:u.href,title,facts:fact,observed_at:observed};
 });
 return {contract:'blog-reader-quality-review-v1',review_id:'blog-reader-review:'+runDate+':'+review.expected_body_sha256,run_date:runDate,channel:'blog',expected_body_sha256:review.expected_body_sha256,reason_codes:[...codes],notes,sources:facts};
}

export function planBlogQualityRepair({runDate,artifact,decision,obligation,violations=[],nowMs=Date.now()}={}){
 const exact=calendarDay(artifact?.run_date)===runDate&&calendarDay(decision?.run_date)===runDate&&calendarDay(obligation?.publication_date)===runDate
  &&artifact?.channel==='blog'&&decision?.channel==='blog'&&obligation?.channel==='blog'&&obligation?.tenant_id==='canonical';
 const unsent=artifact?.status==='content_ready'&&decision?.decision==='publish'
  &&(['content_ready','scheduled'].includes(decision?.state)||(decision?.state==='decided'&&Date.parse(decision?.delivery_evidence?.blog_quality_repair?.claim_expires_at||'')<=nowMs))&&obligation?.status==='GENERATED'
  &&!clean(decision?.delivery_ref)&&!clean(obligation?.external_id)&&!obligation?.published_at&&!obligation?.live_proven_at
  &&Boolean(clean(decision?.updated_at))&&!(Date.parse(decision?.delivery_evidence?.generation_retry_after||'')>nowMs);
 const priorClaim=decision?.delivery_evidence?.blog_quality_repair;
 const completed=Number.isFinite(Date.parse(priorClaim?.completed_at||''))&&Date.parse(priorClaim.completed_at)<=nowMs&&priorClaim.rejected_body!==String(artifact?.body||'');
 const activeClaim=Boolean(clean(priorClaim?.token))&&!completed&&!(Date.parse(priorClaim?.claim_expires_at||'')<=nowMs);
 const ambiguous=[obligation?.evidence,decision?.delivery_evidence,artifact?.generation_evidence]
  .some(e=>sideEffectFlags.some(flag=>e?.[flag]===true));
 return {eligible:exact&&unsent&&!activeClaim&&!ambiguous&&violations.length>0,violations:[...violations]};
}

// Same canonical writer only. A lost CAS never resets another worker's state.
export async function reopenRejectedBlog(db,runDate,validate,review=null){
 if(db.withBlogQualityLock)return db.withBlogQualityLock(runDate,locked=>reopenRejectedBlog(locked,runDate,validate,review));
 const [a,d,o]=await Promise.all([
  db.from('powerhouse_content_artifacts').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
  db.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
  db.from('content_publication_obligations').select('*').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','blog').maybeSingle()
 ]);
 if(a.error||d.error||o.error)throw new Error('BLOG_REPAIR_STATE_READ_FAILED');
 const violations=a.data?[...validate(a.data)]:[];
 const qualityReview=normalizeBlogQualityReview(review,runDate,'blog');
 if(qualityReview){
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(a.data?.body||'')));
  const actual=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(!a.data||actual!==qualityReview.expected_body_sha256)throw new Error('BLOG_QUALITY_REVIEW_ARTIFACT_CHANGED');
  violations.push(...qualityReview.reason_codes);
 }
 const plan=planBlogQualityRepair({runDate,artifact:a.data,decision:d.data,obligation:o.data,violations});
 if(!plan.eligible)return {reopened:false};
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(a.data.body||'')));
 const rejectedHash=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const evidence={...d.data.delivery_evidence,blog_quality_repair:{contract:'same-obligation-unsent-blog-quality-repair-v1',token:crypto.randomUUID(),claim_expires_at:new Date(Date.now()+8*60000).toISOString(),quality_review:qualityReview,recommendation_id:a.data.generation_evidence?.recommendation_id||null,rejected_body:String(a.data.body||''),rejected_updated_at:a.data.updated_at||null,rejected_body_sha256:rejectedHash,rejection_codes:violations,requested_at:new Date().toISOString(),previous_state:d.data.state,seo_slug:o.data.slug||a.data.generation_evidence?.seo_slug||null}};
 const changed=await db.from('powerhouse_channel_decisions').update({state:'decided',delivery_evidence:evidence,updated_at:new Date().toISOString()})
  .eq('run_date',runDate).eq('channel','blog').eq('decision','publish').eq('state',d.data.state)
  .eq('updated_at',d.data.updated_at).eq('delivery_ref',null).select('channel,priority,rationale,delivery_evidence').maybeSingle();
 if(changed.error)throw new Error('BLOG_REPAIR_CAS_FAILED');
 return {reopened:Boolean(changed.data),claim:changed.data?evidence.blog_quality_repair:null,pending:changed.data?{channel:'blog',priority:changed.data.priority??d.data.priority,rationale:changed.data.rationale??d.data.rationale,delivery_evidence:changed.data.delivery_evidence||evidence}:null,rejected_body_sha256:rejectedHash,violations};
}

export function canCommitBlogQualityRepair({runDate,artifact,decision,obligation,claim}={}){
 const exact=calendarDay(artifact?.run_date)===runDate&&calendarDay(decision?.run_date)===runDate&&calendarDay(obligation?.publication_date)===runDate
  &&artifact?.channel==='blog'&&decision?.channel==='blog'&&obligation?.channel==='blog'&&obligation?.tenant_id==='canonical';
 const safe=obligation?.status==='GENERATED'&&!obligation?.external_id&&!obligation?.published_at&&!obligation?.live_proven_at
  &&artifact?.status==='content_ready'&&['decided','content_ready'].includes(decision?.state)&&decision?.decision==='publish'&&!decision?.delivery_ref
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
  if(String(artifact?.body||'')===claim.rejected_body)throw new Error('BLOG_REPAIR_UNCHANGED_BODY');
  const aw=await locked.from('powerhouse_content_artifacts').upsert(artifact);if(aw.error)throw new Error('BLOG_REPAIR_ARTIFACT_WRITE_FAILED');
  const completedClaim={...d.data.delivery_evidence.blog_quality_repair,completed_at:new Date().toISOString()};
  const completedDecision={...decision,delivery_evidence:{...d.data.delivery_evidence,...decision.delivery_evidence,blog_quality_repair:completedClaim}};
  const dw=await locked.from('powerhouse_channel_decisions').update(completedDecision).eq('run_date',runDate).eq('channel','blog').eq('state',d.data.state).eq('updated_at',d.data.updated_at);if(dw.error)throw new Error('BLOG_REPAIR_DECISION_WRITE_FAILED');
  return {error:null};
 });
}

// Only this invocation's successful locked claim supplies additional local work.
export function includeOwnedBlogRepair(rows,repair){
 const claim=repair?.reopened===true?repair.claim:null;
 const pending=(Array.isArray(rows)?rows:[]).filter(row=>row.channel!=='blog'||!row.delivery_evidence?.blog_quality_repair?.token||row.delivery_evidence.blog_quality_repair.token===claim?.token);
 const owned=repair?.pending;
 if(claim?.token&&owned?.channel==='blog'&&owned.delivery_evidence?.blog_quality_repair?.token===claim.token&&!pending.some(row=>row.channel==='blog'))pending.push(owned);
 return pending;
}

// Failed generation retains the rejected artifact and the real bounded cooldown.
export async function persistBlogRepairFailure(db,runDate,claim,failure){
 return db.withBlogQualityLock(runDate,async locked=>{
  const [a,d,o]=await Promise.all([
   locked.from('powerhouse_content_artifacts').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
   locked.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
   locked.from('content_publication_obligations').select('*').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','blog').maybeSingle()
  ]);
  if(a.error||d.error||o.error||!canCommitBlogQualityRepair({runDate,artifact:a.data,decision:d.data,obligation:o.data,claim}).eligible)throw new Error('BLOG_REPAIR_OWNERSHIP_OR_DELIVERY_CHANGED');
  const write=await locked.from('powerhouse_channel_decisions').update({
   delivery_evidence:{...d.data.delivery_evidence,generation_retry_after:failure.retry_after,artifact_generation_failure:failure},
   updated_at:new Date().toISOString()
  }).eq('run_date',runDate).eq('channel','blog').eq('state',d.data.state).eq('updated_at',d.data.updated_at).select('channel').maybeSingle();
  if(write.error||!write.data)throw new Error('BLOG_REPAIR_FAILURE_WRITE_FAILED');
  return {error:null};
 });
}
