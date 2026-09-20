import {billingReadiness} from '../../platform/saas/billing-readiness.mjs';

export default async ()=>{
  const readiness=billingReadiness();
  return Response.json({
    provider:readiness.provider,
    selfServeAvailable:readiness.selfServeAvailable,
    state:readiness.state
  },{headers:{'cache-control':'no-store'}});
};

export const config={path:'/api/checkout/readiness'};
