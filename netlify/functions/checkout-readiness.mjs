import {billingReadiness,checkoutStatus,callCheckoutEdge} from '../../platform/saas/billing-readiness.mjs';

export default async request=>{
  if(request.method!=='GET')return Response.json({error:'method_not_allowed'},{status:405});
  const sessionId=new URL(request.url).searchParams.get('session_id');
  if(sessionId){
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId))return Response.json({error:'invalid_session'},{status:400});
    try{
      return Response.json(await checkoutStatus(sessionId),{headers:{'cache-control':'no-store'}});
    }catch{return Response.json({ready:false,state:'unavailable'},{status:503,headers:{'cache-control':'no-store'}})}
  }
  const readiness=billingReadiness();
  let selfServeAvailable=false,state=readiness.state;
  if(readiness.selfServeAvailable){
    try{
      const edge=await callCheckoutEdge('?readiness=1');
      selfServeAvailable=edge.ok&&edge.data?.selfServeAvailable===true;
      state=selfServeAvailable?'ready':'blocked';
    }catch{state='blocked'}
  }
  return Response.json({provider:readiness.provider,selfServeAvailable,state},{headers:{'cache-control':'no-store'}});
};

export const config={path:'/api/checkout/readiness'};
