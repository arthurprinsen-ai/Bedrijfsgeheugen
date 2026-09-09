const required=(v,label)=>{if(!v)throw new Error(`Revenue learning store configuration missing: ${label}`);return v;};

export function createRevenueLearningStore({fetchFn=globalThis.fetch,baseUrl=process.env.BG_SOCIAL_LEARNING_SUPABASE_URL||process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN,tenantId=process.env.BG_SOCIAL_LEARNING_TENANT_ID||'canonical'}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(serviceToken,'serviceToken');required(tenantId,'tenantId');
  const endpoint=`${String(baseUrl).replace(/\/$/,'')}/functions/v1/revenue-learning-store`;
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken};
  async function gateway(body){
    const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify({tenantId,...body})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const e=new Error(`Revenue learning store ${data?.error||'gateway failed'} (${response.status})`);e.status=response.status;throw e;}
    return data||{};
  }
  return Object.freeze({
    listProjectionCandidates:async(now)=>(await gateway({action:'list_projection_candidates',now})).candidates||[],
    upsertEvidence:evidence=>gateway({action:'upsert_evidence',evidence,idempotencyKey:`evidence:${evidence.evidenceId}`}),
    listDueEvidence:async(now)=>(await gateway({action:'list_due_evidence',now})).evidence||[],
    listCohort:async(query)=>(await gateway({action:'list_cohort',query})).evidence||[],
    markEvidenceEvaluated:(evidenceId,evaluatedAt)=>gateway({action:'mark_evidence_evaluated',evidenceId,evaluatedAt,idempotencyKey:`evaluated:${evidenceId}:${evaluatedAt}`}),
    upsertLearning:learning=>gateway({action:'upsert_learning',learning,idempotencyKey:`learning:${learning.learningId||learning.fingerprint}`}),
    listCurrentLearnings:async()=>(await gateway({action:'list_current_learnings'})).learnings||[],
    recordApplication:application=>gateway({action:'record_application',application,idempotencyKey:`application:${application.applicationId}`}),
    reconcileApplications:data=>gateway({action:'reconcile_applications',data,idempotencyKey:`reconcile:${data.contentId}:${data.windowHours||0}`}),
    recordDecision:decision=>gateway({action:'record_decision',decision,idempotencyKey:`decision:${decision.decisionId}`}),
    recordObligation:obligation=>gateway({action:'record_obligation',obligation,idempotencyKey:`obligation:${obligation.id}`}),
    getProjection:async()=>(await gateway({action:'get_projection'})).projection||null,
    putProjection:projection=>gateway({action:'put_projection',projection,idempotencyKey:`projection:${projection.version}`})
  });
}
