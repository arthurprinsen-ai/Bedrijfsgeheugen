import {getUser} from '@netlify/identity';
import {createPortalProjectStore} from './_portal-project-store.mjs';

const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async request=>{
  if(request.method!=='GET')return json(405,{error:'method_not_allowed'});
  const user=await getUser();
  if(!user)return json(401,{error:'authentication_required'});
  const store=createPortalProjectStore();
  const tenantId=await store.resolveTenant(user);
  if(!tenantId)return json(403,{error:'tenant_not_resolved'});
  const subscription=await store.getEntitlements(tenantId);
  if(!subscription)return json(402,{error:'subscription_required'});
  return json(200,{
    organisation_id:tenantId,
    plan:subscription.plan_code,
    plan_name:subscription.plan_name,
    status:subscription.status,
    entitlements:subscription.entitlements
  });
};
export const config={path:'/api/portal-entitlements'};