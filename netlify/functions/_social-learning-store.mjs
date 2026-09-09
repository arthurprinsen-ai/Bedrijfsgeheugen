const required=(value,label)=>{if(!value)throw new Error(`Social learning store configuration missing: ${label}`);return value;};

export function createSocialLearningStore({fetchFn=globalThis.fetch,baseUrl=process.env.BG_SOCIAL_LEARNING_SUPABASE_URL||process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN,tenantId=process.env.BG_SOCIAL_LEARNING_TENANT_ID||'canonical'}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(serviceToken,'serviceToken');required(tenantId,'tenantId');
  const endpoint=`${String(baseUrl).replace(/\/$/,'')}/functions/v1/social-learning-store`;
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken};
  async function gateway(body){
    const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify({tenantId,...body})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(`Social learning store ${data?.error||'gateway failed'} (${response.status})`);error.status=response.status;throw error;}
    return data||{};
  }
  return Object.freeze({
    putPost:post=>gateway({action:'put_post',tenantId:post.tenantId||tenantId,post,idempotencyKey:`post:${post.postId}`}),
    appendSnapshot:snapshot=>gateway({action:'append_snapshot',tenantId:snapshot.tenantId||tenantId,snapshot,idempotencyKey:`snapshot:${snapshot.snapshotId}`}),
    getPost:async postId=>(await gateway({action:'get_post',postId})).post||null,
    getSnapshots:async postId=>(await gateway({action:'get_snapshots',postId})).snapshots||[],
    listDuePosts:async now=>(await gateway({action:'list_due_posts',now})).posts||[],
    getCohort:async query=>(await gateway({action:'get_cohort',tenantId:query?.post?.tenantId||tenantId,query})).posts||[],
    putEvaluation:evaluation=>gateway({action:'put_evaluation',tenantId:evaluation.tenantId||tenantId,evaluation,idempotencyKey:evaluation.evaluationId}),
    upsertExperiment:experiment=>gateway({action:'upsert_experiment',tenantId:experiment.tenantId||tenantId,experiment,idempotencyKey:`experiment:${experiment.experimentId}`}),
    upsertLearning:learning=>gateway({action:'upsert_learning',tenantId:learning.tenantId||tenantId,learning,idempotencyKey:`learning:${learning.learningId||learning.fingerprint}`}),
    listCurrentLearnings:async selectedTenantId=>(await gateway({action:'list_current_learnings',tenantId:selectedTenantId||tenantId})).learnings||[],
    recordApplication:application=>gateway({action:'record_application',tenantId:application.tenantId||tenantId,application,idempotencyKey:`application:${application.applicationId||`${application.postId}:${application.learningId}`}`}),
    recordDecision:decision=>gateway({action:'record_decision',tenantId:decision.tenantId||tenantId,decision,idempotencyKey:`decision:${decision.decisionId}`}),
    reconcileApplication:application=>gateway({action:'reconcile_application',tenantId:application.tenantId||tenantId,application,idempotencyKey:`reconcile:${application.applicationId||`${application.postId}:${application.learningId}`}`}),
    reconcileApplications:data=>gateway({action:'reconcile_applications',tenantId:data.tenantId||tenantId,data,idempotencyKey:`reconcile-window:${data.postId}:${data.windowHours}`}),
    recordObligation:obligation=>gateway({action:'record_obligation',tenantId:obligation.tenantId||tenantId,obligation,idempotencyKey:`obligation:${obligation.id}`}),
    getProjection:async selectedTenantId=>(await gateway({action:'get_projection',tenantId:selectedTenantId||tenantId})).projection||null,
    putProjection:projection=>gateway({action:'put_projection',tenantId:projection.tenantId||tenantId,projection,idempotencyKey:`projection:${projection.tenantId||tenantId}:${projection.version}`})
  });
}
