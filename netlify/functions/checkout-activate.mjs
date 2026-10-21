import {getUser,admin,verifyRequestOrigin} from '@netlify/identity';
import {createPortalProjectStore} from './_portal-project-store.mjs';

const json=(status,body)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
export function createAccountActivationHandler({getUserFn=getUser,updateUser=admin.updateUser,verifyOrigin=verifyRequestOrigin,storeFactory=createPortalProjectStore}={}){
  return async request=>{
    if(request.method!=='POST')return json(405,{error:'method_not_allowed'});
    try{verifyOrigin(request)}catch{return json(403,{error:'origin_not_allowed'})}
    const user=await getUserFn();
    if(!user?.id)return json(401,{error:'authentication_required'});
    if(!user.confirmedAt)return json(403,{error:'email_confirmation_required'});
    try{
      const store=storeFactory(),tenantId=await store.resolvePaidInvitation(user);
      if(!tenantId)return json(409,{error:'paid_organisation_not_resolved'});
      const existing=user.appMetadata?.tenantId||user.app_metadata?.tenantId;
      if(existing&&existing!==tenantId)return json(409,{error:'organisation_conflict'});
      if(existing===tenantId)return json(200,{ok:true,refresh_required:false});
      // Never hide or overwrite an established personal workspace by changing
      // its namespace. Its customer-owned data needs an explicit migration.
      if(await store.hasPersonalPortalState(user.id))return json(409,{error:'existing_workspace_reconciliation_required'});
      // Server-managed tenant claims take effect on next login/token refresh.
      const updated=await updateUser(user.id,{app_metadata:{...(user.appMetadata||user.app_metadata||{}),tenantId}});
      if(updated?.appMetadata?.tenantId!==tenantId&&updated?.app_metadata?.tenantId!==tenantId)throw Error('IDENTITY_NOT_BOUND');
      return json(200,{ok:true,refresh_required:true});
    }catch{return json(503,{error:'activation_unavailable'})}
  };
}
export default createAccountActivationHandler();
export const config={path:'/api/checkout/activate'};
