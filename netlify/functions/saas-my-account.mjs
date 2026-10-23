import {getUser} from '@netlify/identity';
import {createPortalProjectStore} from './_portal-project-store.mjs';
import {createCustomerAccountHandler} from '../../platform/saas/customer-account-handler.mjs';

export default createCustomerAccountHandler({getUser,storeFactory:createPortalProjectStore});
export const config={path:'/api/saas/my-account'};
