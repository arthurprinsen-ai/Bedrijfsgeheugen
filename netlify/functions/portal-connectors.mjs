import {getUser} from '@netlify/identity';
import {handlePortalConnectorsRequest} from '../../platform/api/portal-connectors-handler.mjs';
import {createPortalConnectorsStore} from './_portal-connectors-store.mjs';
import {createConnectorRuntime,createEnvironmentConnectorProviders} from '../../platform/connectors/connector-runtime.mjs';

const store=createPortalConnectorsStore();
const engine=createConnectorRuntime({providers:createEnvironmentConnectorProviders()});
export default async request=>handlePortalConnectorsRequest({request,user:await getUser(),store,engine});
export const config={path:'/api/connectors/*'};
