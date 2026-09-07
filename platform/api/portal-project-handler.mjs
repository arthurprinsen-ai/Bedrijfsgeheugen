import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const isProjectTenantId=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));

export function createPortalProjectHandler({getUser,store}={}){
  if(typeof getUser!=='function'||!store?.get)throw new TypeError('getUser and store.get are required');
  return async request=>{
    if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
    const user=await getUser();
    if(!user?.id)return json({error:'UNAUTHORIZED'},401);
    let tenantId=resolveIdentityTenant(user);
    if(!isProjectTenantId(tenantId)&&typeof store.resolveTenant==='function')tenantId=await store.resolveTenant(user);
    if(!isProjectTenantId(tenantId))return json({error:'TENANT_NOT_CONFIGURED'},403);
    const record=await store.get(tenantId);
    return record?json(record):json({error:'NOT_FOUND'},404);
  };
}
