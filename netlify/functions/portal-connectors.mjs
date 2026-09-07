import {getUser} from '@netlify/identity';
import {handlePortalConnectorsRequest} from '../../platform/api/portal-connectors-handler.mjs';
import {createPortalConnectorsStore} from './_portal-connectors-store.mjs';

const store=createPortalConnectorsStore();
export default async request=>handlePortalConnectorsRequest({request,user:await getUser(),store});
export const config={path:'/api/connectors/*'};
