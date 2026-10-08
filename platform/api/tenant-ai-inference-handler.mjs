import {runAttestedTenantChat} from '../runtime/attested-cloud-ai.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
export async function handleTenantAiInference({request,user,tenantId,sovereignty,registry,proofKey,fetchFn,now=Date.now()}={}){
 if(request?.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
 // Tenant ID is supplied by the trusted Identity gateway, never from a browser input.
 if(!user?.id||typeof tenantId!=='string'||!tenantId.trim())return json({error:'UNAUTHORIZED'},401);
 const record=registry?.[tenantId];
 if(!record||typeof proofKey!=='string'||!record.signedProof||!record.config)
  return json({error:'AI_RUNTIME_NOT_PROVISIONED'},503);
 const size=Number(request.headers?.get?.('content-length')||0);
 if(Number.isFinite(size)&&size>12000)return json({error:'REQUEST_TOO_LARGE'},413);
 let body;
 try{
  if(typeof request.text==='function'){
   const raw=await request.text();
   if(raw.length>12000)return json({error:'REQUEST_TOO_LARGE'},413);
   body=JSON.parse(raw);
  }else body=await request.json();
 }catch{return json({error:'INVALID_JSON'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.question!=='string'
    ||body.question.trim().length<1||body.question.length>6000||Object.keys(body).some(k=>k!=='question'))
  return json({error:'INVALID_AI_QUESTION'},422);
 if(typeof sovereignty?.get!=='function')return json({error:'SOVEREIGNTY_PROOF_UNAVAILABLE'},503);
 let state;
 try{state=await sovereignty.get(tenantId);}
 catch{return json({error:'SOVEREIGNTY_PROOF_UNAVAILABLE'},503);}
 const policy=state?.snapshot?.policy;
 if(!policy?.ai_deployment_profile||!Number.isSafeInteger(Number(policy.policy_version))
    ||Number(policy.policy_version)<1)return json({error:'AI_RUNTIME_NOT_PROVISIONED'},503);
 if(policy?.enforcement_mode==='BLOCK'&&Array.isArray(state?.snapshot?.violations)&&state.snapshot.violations.length)
  return json({error:'SOVEREIGNTY_POLICY_BLOCKED'},409);
 // A newly requested AI route cannot go live just because the provider proof exists:
 // the customer's privacy, risk, supplier, cost and CSRD review must also be closed.
 if(policy?.last_change_impact?.status==='REVIEW_REQUIRED'&&policy.last_change_impact.deploymentApproved!==true)
  return json({error:'CROSS_DOMAIN_REVIEW_REQUIRED'},409);
 // No direct user-origin model/provider/endpoint/region parameters; the model comes
 // exclusively from the tenant's authoritative saved policy and signed proof.
 const question=body.question.trim();
 try{
  const answer=await runAttestedTenantChat({
    tenantId,useCaseId:'portal-project-answer',
    profile:policy.ai_deployment_profile,policyVersion:Number(policy.policy_version),
    signedProof:record.signedProof,key:proofKey,now,config:record.config,fetchFn,
    request:{maxTokens:768,messages:[
      {role:'system',content:'Provide a grounded answer. Do not claim access to private documents, knowledge sources or verified results that were not provided. Do not execute actions.'},
      {role:'user',content:question}
    ]}
  });
  return json({status:'ANSWERED',answer:answer.text,provider:answer.provenance.provider,
    modelId:answer.provenance.modelId,evidenceId:answer.provenance.evidenceId,
    tokenUsageStatus:answer.providerUsage?'REPORTED_BY_PROVIDER':'UNAVAILABLE'});
 }catch(error){
  if(error?.code==='AI_RUNTIME_NOT_VERIFIED')return json({error:'AI_RUNTIME_NOT_VERIFIED'},409);
  return json({error:'AI_RUNTIME_PROVIDER_FAILED'},502);
 }
}
