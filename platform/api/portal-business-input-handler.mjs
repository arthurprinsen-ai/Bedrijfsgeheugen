import { resolveIdentityTenant, sanitizePortalProjection } from '../read-models/portal-server-state.mjs';
import { PORTAL_LAYERS, projectCanonicalObject } from '../read-models/portal-projection-layers.mjs';
import { createPortalBusinessInput } from '../contracts/portal-business-input.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

export function createPortalBusinessInputHandler({getUser,store,maxBytes=750_000,now=()=>new Date().toISOString()}={}){
  if(typeof getUser!=='function')throw new TypeError('getUser is required');
  if(!store?.getLayer||!store?.putCanonical)throw new TypeError('store getLayer/putCanonical are required');
  return async function handle(request){
    if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const user=await getUser();
    if(!user?.id)return json({error:'UNAUTHORIZED'},401);
    const tenantId=resolveIdentityTenant(user);
    if(!tenantId)return json({error:'FORBIDDEN'},403);
    const declared=Number(request.headers.get('content-length')||0);
    if(declared>maxBytes)return json({error:'PAYLOAD_TOO_LARGE'},413);
    let body;
    try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
    const measured=new TextEncoder().encode(JSON.stringify(body)).byteLength;
    if(measured>maxBytes)return json({error:'PAYLOAD_TOO_LARGE'},413);
    let object;
    try{
      object=createPortalBusinessInput({...body,tenantId,userId:user.id,submittedAt:body?.submittedAt||now()},{now});
    }catch(error){return json({error:'INVALID_PORTAL_INPUT',message:error instanceof Error?error.message:String(error)},400)}
    const current=await store.getLayer(tenantId,PORTAL_LAYERS.CANONICAL);
    const projected=projectCanonicalObject(current?.data||current||{},object);
    const canonical=sanitizePortalProjection(projected,{tenantId,userId:user.id,origin:PORTAL_LAYERS.CANONICAL,now});
    const result=await store.putCanonical(tenantId,canonical);
    const record=result?.record||canonical;
    return json({stored:Boolean(result?.stored),stale:Boolean(result?.stale),objectId:object.id,truthClass:object.truthClass,sourceUpdatedAt:record.sourceUpdatedAt});
  };
}
