import {evaluateTenantAiActivation} from './tenant-ai-activation-readiness.mjs';
const respond=(body,status=200)=>Response.json(body,{status,headers:{
 'cache-control':'private, no-store','vary':'authorization, cookie'
}});
export async function handleTenantAiActivationStatus({
 request,user,tenantId,store,sovereignty,registry,proofKey,catalog,supplierStatus,now=Date.now()
}={}){
 if(request?.method!=='GET')return respond({error:'METHOD_NOT_ALLOWED'},405);
 if(!user?.id||typeof tenantId!=='string'||!tenantId.trim())
  return respond({error:'UNAUTHORIZED'},401);
 if(typeof store?.get!=='function'||typeof sovereignty?.get!=='function')
  return respond({error:'AUTHORITATIVE_READBACK_UNAVAILABLE'},503);
 let portalRecord,sovereigntyState;
 try{
  [portalRecord,sovereigntyState]=await Promise.all([
   store.get(tenantId),sovereignty.get(tenantId)
  ]);
 }catch{return respond({error:'AUTHORITATIVE_READBACK_UNAVAILABLE'},503);}
 if(portalRecord&&portalRecord.tenantId!==tenantId)
  return respond({error:'TENANT_SCOPE_MISMATCH'},403);
 const result=evaluateTenantAiActivation({
  tenantId,portalRecord,sovereigntySnapshot:sovereigntyState?.snapshot,
  registryRecord:registry?.[tenantId],proofKey,catalog,supplierStatus,now
 });
 return respond(result);
}
