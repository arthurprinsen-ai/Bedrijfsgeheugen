const SECRET_KEY=/password|secret|token|authorization|api[-_]?key|client[-_]?secret/i;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
function tenantFromUser(user){return user?.tenantId||user?.app_metadata?.tenantId||user?.app_metadata?.tenant_id||null;}
function clean(value){if(Array.isArray(value))return value.map(clean);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([key])=>!SECRET_KEY.test(key)).map(([key,val])=>[key,clean(val)]));}
function normalizedRequest(request){const rawPath=request?.path||request?.url||'/api/connectors';let path=rawPath;try{path=new URL(rawPath,'https://portal.local').pathname;}catch{}return {method:String(request?.method||'GET').toUpperCase(),path,body:request?.body};}
async function requestBody(request,normalized){if(normalized.body!==undefined){if(typeof normalized.body==='string'){try{return JSON.parse(normalized.body);}catch{return {};}}return normalized.body||{};}if(typeof request?.json==='function'){try{return await request.json();}catch{return {};}}return {};}
function executionVersion(row){return Number(row?.connector_versie??row?.connectorVersion??0);}
function executionEvidence(row){return row?.evidence&&typeof row.evidence==='object'?row.evidence:{};}
const fingerprintPart=value=>String(value||'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'unknown';
function recoveryFingerprint(connectorId,failedStage,errorClass){return `connector-${fingerprintPart(connectorId)}-${fingerprintPart(failedStage)}-${fingerprintPart(errorClass)}`;}

export async function handlePortalConnectorsRequest({request,user,store,engine}={}){
  if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  if(!store?.configured&&store?.configured!==undefined)return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
  let tenantId=tenantFromUser(user);if(!tenantId&&typeof store?.resolveTenant==='function')tenantId=await store.resolveTenant(user);if(!tenantId)return json({error:'TENANT_NOT_CONFIGURED'},403);
  const normalized=normalizedRequest(request),base='/api/connectors';
  const suffix=normalized.path.startsWith(base)?normalized.path.slice(base.length):'';
  const segments=suffix.replace(/^\//,'').split('/').filter(Boolean),id=segments[0]||null,action=segments[1]||null,subaction=segments[2]||null;

  if(normalized.method==='GET'&&id==='readiness'&&!action){if(!engine?.readiness)return json({error:'CONNECTOR_RUNTIME_NOT_CONFIGURED'},503);return json(clean(engine.readiness));}
  if(normalized.method==='GET'&&id==='review-queue'){if(typeof store?.listReviewQueue!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);return json(clean(await store.listReviewQueue(tenantId)));}
  if(normalized.method==='POST'&&id==='reviews'&&action&&subaction==='decision'){
    if(typeof store?.getReview!=='function'||typeof store?.decideReview!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
    const review=await store.getReview(tenantId,action);if(!review)return json({error:'NOT_FOUND'},404);
    const body=clean(await requestBody(request,normalized));if(!['approve','reject'].includes(body.decision))return json({error:'INVALID_REVIEW_DECISION'},422);
    const decided=await store.decideReview(tenantId,action,{decision:body.decision,corrections:body.corrections||{},decidedBy:user.id,decidedAt:new Date().toISOString()});
    const replayObligation=body.decision==='approve'?{required:true,maxAttempts:1,reason:'REVIEW_APPROVED',executionId:review.execution_id||null}:{required:false,maxAttempts:0,reason:'REVIEW_REJECTED'};
    return json(clean({...decided,replayObligation}));
  }
  if(normalized.method==='GET'&&!id){if(typeof store?.list!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);return json(clean(await store.list(tenantId)));}
  if(normalized.method==='GET'&&id&&action==='executions'){if(typeof store?.listExecutions!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);return json(clean(await store.listExecutions(tenantId,id)));}
  if(normalized.method==='GET'&&id&&!action){if(typeof store?.get!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);const record=await store.get(tenantId,id);return record?json(clean(record)):json({error:'NOT_FOUND'},404);}
  if(normalized.method==='POST'&&!id){if(typeof store?.saveDraft!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);const body=clean(await requestBody(request,normalized));return json(clean(await store.saveDraft(tenantId,{...body,state:body.state||'Draft'})),201);}
  if(normalized.method==='PUT'&&id&&action==='draft'){if(typeof store?.saveDraft!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);const body=clean(await requestBody(request,normalized));return json(clean(await store.saveDraft(tenantId,{...body,id,state:body.state||'Draft'})));}
  if(normalized.method==='POST'&&id&&action==='test'){
    if(typeof engine?.runTest!=='function')return json({error:'CONNECTOR_RUNTIME_NOT_CONFIGURED'},503);
    const connector=await store.get(tenantId,id);if(!connector)return json({error:'NOT_FOUND'},404);
    const body=clean(await requestBody(request,normalized));let result;
    try{
      result=await engine.runTest({tenantId,connector,input:body.sample,user});
    }catch(error){
      const classification=typeof engine?.classifyError==='function'?engine.classifyError(error):{retryable:false,maxAttempts:0,recoveryRequired:true,class:'runtime'};
      const failedStage=String(error?.failedStage||'runtime');
      const evidenceId=String(error?.executionId||`failure-${Date.now()}`);
      const fingerprint=recoveryFingerprint(id,failedStage,classification?.class||'runtime');
      const failureEvidence={evidenceId,failedStage,classification:{class:classification?.class||'runtime',retryable:Boolean(classification?.retryable),maxAttempts:Number(classification?.maxAttempts)||0},recoveryRequired:true};
      let persistedFailure=null;
      if(typeof store.saveExecution==='function')persistedFailure=await store.saveExecution(tenantId,{connectorId:id,connectorVersion:connector.version,status:'TEST_FAILED',dedupeKey:null,evidence:failureEvidence,error:{code:error?.code||'CONNECTOR_TEST_FAILED',class:classification?.class||'runtime'},completedAt:new Date().toISOString()});
      const recoveryObligation={
        status:'open',reason:error?.code||'CONNECTOR_TEST_FAILED',failedStage,evidenceId:persistedFailure?.id||evidenceId,fingerprint,openedAt:new Date().toISOString(),owner:user.id,
        retry:{allowed:Boolean(classification?.retryable),maxAttempts:Number(classification?.maxAttempts)||0},
        writeback:{status:'queued',route:'BG168→BG166',fingerprint,maxAttempts:1}
      };
      if(typeof store.saveDraft==='function')await store.saveDraft(tenantId,{...connector,id,runtime:{...(connector.runtime||{}),recoveryObligation}});
      return json({error:error?.code||'CONNECTOR_TEST_FAILED',message:String(error?.message||error),classification:clean(classification),failedStage,evidenceId:persistedFailure?.id||evidenceId,recoveryRequired:true,recoveryObligation:clean(recoveryObligation)},422);
    }
    let persisted=null;
    if(typeof store.saveExecution==='function')persisted=await store.saveExecution(tenantId,{connectorId:id,connectorVersion:connector.version,status:result.status,dedupeKey:result.dedupeKey,evidence:result.evidence,error:result.error||null,completedAt:result.completedAt});
    const runtimeExecutionId=result?.evidence?.testExecutionId||result?.executionId||null;
    const persistedId=persisted?.id||runtimeExecutionId;
    const returned={...result,executionId:persistedId||result?.executionId||null,evidence:{...(result.evidence||{}),runtimeExecutionId,testExecutionId:persistedId}};
    if(result.status==='REVIEW_REQUIRED'&&typeof store.saveReview==='function')await store.saveReview(tenantId,{connectorId:id,executionId:persisted?.id||null,status:'pending',payload:{reasons:result.reviewReasons,proposedPayload:result.proposedPayload,evidence:returned.evidence}});
    if(result.status==='TEST_PASSED'&&connector?.runtime?.recoveryObligation?.status==='open'&&typeof store.saveDraft==='function'){
      const resolved={...connector.runtime.recoveryObligation,status:'resolved',resolvedAt:new Date().toISOString(),resolvedByExecutionId:persistedId||runtimeExecutionId};
      await store.saveDraft(tenantId,{...connector,id,runtime:{...(connector.runtime||{}),recoveryObligation:resolved}});
      returned.recoveryObligation=resolved;
    }
    return json(clean(returned));
  }
  if(normalized.method==='POST'&&id&&action==='activate'){
    const connector=await store.get(tenantId,id);if(!connector)return json({error:'NOT_FOUND'},404);
    const body=clean(await requestBody(request,normalized)),testExecutionId=body.testExecutionId;
    if(!testExecutionId)return json({error:'TEST_EVIDENCE_REQUIRED'},409);
    if(typeof store?.getExecution!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
    const execution=await store.getExecution(tenantId,id,testExecutionId);if(!execution)return json({error:'TEST_EVIDENCE_NOT_FOUND'},409);
    if(execution.status!=='TEST_PASSED')return json({error:'TEST_EVIDENCE_NOT_PASSED'},409);
    if(executionVersion(execution)!==Number(connector.version))return json({error:'TEST_EVIDENCE_VERSION_MISMATCH'},409);
    const persistedEvidence={...executionEvidence(execution),testExecutionId:execution.id||testExecutionId};
    const eligibility=typeof engine?.activationEligibility==='function'?engine.activationEligibility(connector,persistedEvidence):{eligible:false,reason:'TEST_EVIDENCE_REQUIRED'};
    if(!eligibility.eligible)return json({error:eligibility.reason},409);
    const activationEvidence={...persistedEvidence,activatedAt:new Date().toISOString(),activatedBy:user.id};
    return json(clean(await store.saveDraft(tenantId,{...connector,id,state:'Active',runtime:{...(connector.runtime||{}),activationEvidence,recoveryObligation:null}})));
  }
  if(normalized.method==='POST'&&id&&action==='pause'){
    const connector=await store.get(tenantId,id);if(!connector)return json({error:'NOT_FOUND'},404);
    const body=clean(await requestBody(request,normalized)),pausedAt=new Date().toISOString();
    const recoveryObligation={status:'open',reason:String(body.reason||'MANUAL_PAUSE'),openedAt:pausedAt,owner:user.id};
    return json(clean(await store.saveDraft(tenantId,{...connector,id,state:'Paused',runtime:{...(connector.runtime||{}),pausedAt,pausedBy:user.id,recoveryObligation}})));
  }
  return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST, PUT'}});
}
