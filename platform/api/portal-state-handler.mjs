import {resolveIdentityTenant,sanitizePortalProjection,portalProjectionToState} from '../read-models/portal-server-state.mjs';
import {buildRuntimePassportEvidence} from '../read-models/data-ai-runtime-evidence.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
export function createPortalStateHandler({getUser,store,maxBytes=1_500_000,now=()=>new Date().toISOString(),env=process.env}={}){
 if(typeof getUser!=='function') throw new TypeError('getUser is required');
 if(!store?.get||!store?.put) throw new TypeError('store get/put are required');
 return async function handle(request){
   if(!['GET','POST'].includes(request.method)) return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
   const user=await getUser();
   if(!user?.id) return json({error:'UNAUTHORIZED'},401);
   const tenantId=resolveIdentityTenant(user);
   if(!tenantId) return json({error:'FORBIDDEN'},403);
   if(request.method==='GET'){
     const record=await store.get(tenantId);
     if(!record) return json({error:'NOT_FOUND'},404);
     const state=portalProjectionToState(record,user);
     const dataAiRuntime=buildRuntimePassportEvidence(state,{env,now});
     return json({...state,dataAiRuntime});
   }
   const declared=Number(request.headers.get('content-length')||0);
   if(declared>maxBytes) return json({error:'PAYLOAD_TOO_LARGE'},413);
   let body;
   try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
   const measured=new TextEncoder().encode(JSON.stringify(body)).byteLength;
   if(measured>maxBytes) return json({error:'PAYLOAD_TOO_LARGE'},413);
   const projection=sanitizePortalProjection(body,{tenantId,userId:user.id,now});
   const result=await store.put(tenantId,projection);
   return json({stored:Boolean(result?.stored),stale:Boolean(result?.stale),sourceUpdatedAt:(result?.record||projection).sourceUpdatedAt});
 };
}
