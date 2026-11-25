import {getUser} from '@netlify/identity';
import {createPortalProjectStore} from './_portal-project-store.mjs';
import {createCustomerAccountHandler} from '../../platform/saas/customer-account-handler.mjs';

// One canonical Netlify Function for both the existing portal subscription
// contract and the narrower post-checkout account readback. The paid tenant,
// plan and status always come from the same verified server-side store.
const account=createCustomerAccountHandler({getUser,storeFactory:createPortalProjectStore});
const portal=createCustomerAccountHandler({getUser,storeFactory:createPortalProjectStore,includeOrganisationId:true});

export default request=>{
  const pathname=new URL(request.url).pathname;
  return pathname==='/api/saas/my-account'?account(request):portal(request);
};
export const config={path:['/api/portal-entitlements','/api/saas/my-account']};
