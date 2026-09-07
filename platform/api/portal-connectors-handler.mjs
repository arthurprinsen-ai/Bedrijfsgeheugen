const SECRET_KEY=/password|secret|token|authorization|api[-_]?key|client[-_]?secret/i;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

function tenantFromUser(user){return user?.tenantId||user?.app_metadata?.tenantId||user?.app_metadata?.tenant_id||null;}
function clean(value){if(Array.isArray(value))return value.map(clean);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([key])=>!SECRET_KEY.test(key)).map(([key,val])=>[key,clean(val)]));}
function normalizedRequest(request){const rawPath=request?.path||request?.url||'/api/connectors';let path=rawPath;try{path=new URL(rawPath,'https://portal.local').pathname;}catch{}return {method:String(request?.method||'GET').toUpperCase(),path,body:request?.body};}
async function requestBody(request,normalized){if(normalized.body!==undefined){if(typeof normalized.body==='string'){try{return JSON.parse(normalized.body);}catch{return {};}}return normalized.body||{};}if(typeof request?.json==='function'){try{return await request.json();}catch{return {};}}return {};}

export async function handlePortalConnectorsRequest({request,user,store,engine}={}){
  if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  if(!store?.configured&&store?.configured!==undefined)return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
  const tenantId=tenantFromUser(user);if(!tenantId)return json({error:'TENANT_NOT_CONFIGURED'},403);
  const normalized=normalizedRequest(request),base='/api/connectors';
  const suffix=normalized.path.startsWith(base)?normalized.path.slice(base.length):'';
  const segments=suffix.replace(/^\//,'').split('/').filter(Boolean),id=segments[0]||null,action=segments[1]||null;

  if(normalized.method==='GET'&&id==='review-queue'){if(typeof store?.listReviewQueue!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);return json(clean(await store.listReviewQueue(tenantId)));}
  if(normalized.method==='GET'&&!id){if(typeof store?.list!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);return json(clean(await store.list(tenantId)));}
  if(normalized.method==='GET'&&id&&action==='executions'){if(typeof store?.listExecutions!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);return json(clean(await store.listExecutions(tenantId,id)));}
  if(normalized.method==='GET'&&id&&!action){if(typeof store?.get!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);const record=await store.get(tenantId,id);return record?json(clean(record)):json({error:'NOT_FOUND'},404);}
  if(normalized.method==='POST'&&!id){if(typeof store?.saveDraft!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);const body=clean(await requestBody(request,normalized));return json(clean(await store.saveDraft(tenantId,{...body,state:body.state||'Draft'})),201);}
  if(normalized.method==='PUT'&&id&&action==='draft'){if(typeof store?.saveDraft!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);const body=clean(await requestBody(request,normalized));return json(clean(await store.saveDraft(tenantId,{...body,id,state:body.state||'Draft'})));}
  if(normalized.method==='POST'&&id&&action==='test'){
    if(typeof engine?.runTest!=='function')return json({error:'CONNECTOR_RUNTIME_NOT_CONFIGURED'},503);
    const connector=await store.get(tenantId,id);if(!connector)return json({error:'NOT_FOUND'},404);
    const body=clean(await requestBody(request,normalized));let result;
    try{result=await engine.runTest({tenantId,connector,input:body.sample,user});}catch(error){return json({error:error?.code||'CONNECTOR_TEST_FAILED',message:String(error?.message||error)},422);}
    if(typeof store.saveExecution==='function')await store.saveExecution(tenantId,{connectorId:id,connectorVersion:connector.version,status:result.status,dedupeKey:result.dedupeKey,evidence:result.evidence,error:result.error||null,completedAt:result.completedAt});
    if(result.status==='REVIEW_REQUIRED'&&typeof store.saveReview==='function')await store.saveReview(tenantId,{connectorId:id,executionId:null,status:'pending',payload:{reasons:result.reviewReasons,proposedPayload:result.proposedPayload,evidence:result.evidence}});
    return json(clean(result));
  }
  if(normalized.method==='POST'&&id&&action==='activate'){
    const connector=await store.get(tenantId,id);if(!connector)return json({error:'NOT_FOUND'},404);
    const body=clean(await requestBody(request,normalized));const eligibility=typeof engine?.activationEligibility==='function'?engine.activationEligibility(connector,body.evidence||body):{eligible:false,reason:'TEST_EVIDENCE_REQUIRED'};
    if(!eligibility.eligible)return json({error:eligibility.reason},409);
    return json(clean(await store.saveDraft(tenantId,{...connector,id,state:'Active',runtime:{...(connector.runtime||{}),activationEvidence:body.evidence||body,activatedAt:new Date().toISOString(),activatedBy:user.id}})));
  }
  return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST, PUT'}});
}
