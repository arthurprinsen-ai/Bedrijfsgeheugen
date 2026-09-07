import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

export function createPortalProjectHandler({getUser,store}={}){
  if(typeof getUser!=='function'||!store?.get)throw new TypeError('getUser and store.get are required');
  return async request=>{
    if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
    const user=await getUser();
    if(!user?.id)return json({error:'UNAUTHORIZED'},401);
    const tenantId=resolveIdentityTenant(user);
    if(!tenantId)return json({error:'FORBIDDEN'},403);
    const record=await store.get(tenantId);
    return record?json(record):json({error:'NOT_FOUND'},404);
  };
}
