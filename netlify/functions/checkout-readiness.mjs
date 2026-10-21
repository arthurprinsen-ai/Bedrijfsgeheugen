import {billingReadiness,checkoutStatus} from '../../platform/saas/billing-readiness.mjs';
import {createPortalProjectStore} from './_portal-project-store.mjs';

export default async request=>{
  if(request.method!=='GET')return Response.json({error:'method_not_allowed'},{status:405});
  const sessionId=new URL(request.url).searchParams.get('session_id');
  if(sessionId){
    if(!/^cs_(?:test_|live_)?[A-Za-z0-9_]{8,240}$/.test(sessionId))return Response.json({error:'invalid_session'},{status:400});
    try{
      return Response.json(await checkoutStatus(sessionId,{store:createPortalProjectStore()}),{headers:{'cache-control':'no-store'}});
    }catch{return Response.json({ready:false,state:'unavailable'},{status:503,headers:{'cache-control':'no-store'}})}
  }
  const readiness=billingReadiness();
  return Response.json({
    provider:readiness.provider,
    selfServeAvailable:readiness.selfServeAvailable,
    state:readiness.state
  },{headers:{'cache-control':'no-store'}});
};

export const config={path:'/api/checkout/readiness'};
