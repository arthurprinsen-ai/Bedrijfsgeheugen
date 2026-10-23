const json=(status,body)=>Response.json(body,{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store',
  'vary':'authorization, cookie',
  ...(status===503?{'retry-after':'20'}:{})
}});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAID_STATUSES=new Set(['active','trialing']);
const KNOWN_PLANS=new Set(['starter','pro','groei','enterprise']);

// Read-only projection: never take tenant, plan or billing status from the request.
export function createCustomerAccountHandler({getUser,storeFactory}={}){
  if(typeof getUser!=='function'||typeof storeFactory!=='function')
    throw new TypeError('getUser and storeFactory are required');
  return async request=>{
    if(request.method!=='GET')return json(405,{error:'method_not_allowed'});
    let user;
    try{user=await getUser(request)}catch{return json(503,{error:'identity_unavailable'})}
    if(!user?.id)return json(401,{error:'authentication_required'});
    if(!user.confirmedAt)return json(403,{error:'email_confirmation_required'});
    try{
      const store=storeFactory();
      // resolveTenant uses server-verified Netlify app metadata or a unique
      // confirmed-email invitation; never user_metadata or query parameters.
      const tenantId=await store.resolveTenant(user);
      if(!UUID.test(String(tenantId||'')))return json(403,{error:'organisation_not_resolved'});
      const sub=await store.getEntitlements(tenantId);
      if(!sub)return json(402,{error:'subscription_required'});
      // The canonical SaaS view can also include past_due: do not silently
      // treat it as an active entitlement. Keep billing remediation explicit.
      if(!PAID_STATUSES.has(sub.status))return json(402,{error:'subscription_not_active'});
      if(String(sub.organisation_id||'')!==tenantId)
        return json(403,{error:'organisation_scope_mismatch'});
      if(!KNOWN_PLANS.has(String(sub.plan_code||'')))
        return json(503,{error:'plan_unavailable'});
      return json(200,{ready:true,plan:sub.plan_code,
        plan_name:String(sub.plan_name||sub.plan_code),status:sub.status,
        entitlements:sub.entitlements&&typeof sub.entitlements==='object'?sub.entitlements:{}});
    }catch{return json(503,{error:'account_temporarily_unavailable'})}
  };
}
