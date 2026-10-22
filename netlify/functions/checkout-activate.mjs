import {getUser,admin,verifyRequestOrigin} from '@netlify/identity';
import {createPortalProjectStore} from './_portal-project-store.mjs';
import {createAccountActivationHandler} from '../../platform/saas/account-activation.mjs';

export default createAccountActivationHandler({getUserFn:getUser,updateUser:admin.updateUser,verifyOrigin:verifyRequestOrigin,storeFactory:createPortalProjectStore});
export const config={path:'/api/checkout/activate'};
