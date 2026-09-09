const required=(value,label)=>{if(!value)throw new Error(`Social learning store configuration missing: ${label}`);return value;};

export function createSocialLearningStore({fetchFn=globalThis.fetch,baseUrl=process.env.BG_SOCIAL_LEARNING_SUPABASE_URL||process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(serviceToken,'serviceToken');
  const endpoint=`${String(baseUrl).replace(/\/$/,'')}/functions/v1/social-learning-store`;
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken};
  async function gateway(body){
    const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(`Social learning store ${data?.error||'gateway failed'} (${response.status})`);error.status=response.status;throw error;}
    return data||{};
  }
  return Object.freeze({
    putPost:post=>gateway({action:'put_post',post,idempotencyKey:`post:${post.postId}`}),
    appendSnapshot:snapshot=>gateway({action:'append_snapshot',snapshot,idempotencyKey:`snapshot:${snapshot.snapshotId}`}),
    getPost:async postId=>(await gateway({action:'get_post',postId})).post||null,
    getSnapshots:async postId=>(await gateway({action:'get_snapshots',postId})).snapshots||[],
    listDuePosts:async now=>(await gateway({action:'list_due_posts',now})).posts||[],
    getCohort:async query=>(await gateway({action:'get_cohort',query})).posts||[],
    putEvaluation:evaluation=>gateway({action:'put_evaluation',evaluation,idempotencyKey:evaluation.evaluationId}),
    upsertLearning:learning=>gateway({action:'upsert_learning',learning,idempotencyKey:`learning:${learning.learningId||learning.fingerprint}`}),
    listCurrentLearnings:async tenantId=>(await gateway({action:'list_current_learnings',tenantId})).learnings||[],
    recordApplication:application=>gateway({action:'record_application',application,idempotencyKey:`application:${application.applicationId||`${application.postId}:${application.learningId}`}`}),
    recordDecision:decision=>gateway({action:'record_decision',decision,idempotencyKey:`decision:${decision.decisionId}`}),
    reconcileApplication:application=>gateway({action:'reconcile_application',application,idempotencyKey:`reconcile:${application.applicationId||`${application.postId}:${application.learningId}`}`}),
    reconcileApplications:data=>gateway({action:'reconcile_applications',data,idempotencyKey:`reconcile-window:${data.postId}:${data.windowHours}`}),
    recordObligation:obligation=>gateway({action:'record_obligation',obligation,idempotencyKey:`obligation:${obligation.id}`}),
    getProjection:async tenantId=>(await gateway({action:'get_projection',tenantId})).projection||null,
    putProjection:projection=>gateway({action:'put_projection',projection,idempotencyKey:`projection:${projection.tenantId}:${projection.version}`})
  });
}
