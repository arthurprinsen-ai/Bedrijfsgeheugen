import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';
const reply=(body,status=200,extra={})=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie',...extra}});
export function createOperatingLoopHandler({getUser,store}={}){
  if(typeof getUser!=='function') throw new TypeError('getUser is required');
  if(!store?.append||!store?.getProjection) throw new TypeError('operating loop store is required');
  return async request=>{
    const user=await getUser(request);if(!user?.id) return reply({error:'UNAUTHENTICATED'},401);const tenantId=resolveIdentityTenant(user);if(!tenantId) return reply({error:'TENANT_UNRESOLVED'},403);
    if(request.method==='GET') return reply(await store.getProjection(tenantId),200);
    if(request.method==='POST'){
      let body;try{body=await request.json();}catch{return reply({error:'INVALID_JSON'},400);}
      if(body?.command==='CERTIFY_RUNTIME'){
        if(typeof store.certifyRuntime!=='function') return reply({error:'RUNTIME_CERTIFICATION_UNAVAILABLE'},503);
        try{return reply(await store.certifyRuntime({tenantId,platform:body.platform,correlationId:body.correlationId,runtimeEvidence:body.runtimeEvidence||{}}),200);}
        catch(error){if(error instanceof TypeError) return reply({error:'INVALID_CERTIFICATION_REQUEST',message:error.message},400);throw error;}
      }
      try{const result=await store.append({...body,tenantId});return reply(result,result.duplicate?200:201);}catch(error){if(error?.code==='BRAIN_RECORD_CONFLICT') return reply({error:error.code},409);if(error instanceof TypeError) return reply({error:'INVALID_RECORD',message:error.message},400);throw error;}
    }
    return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
  };
}
