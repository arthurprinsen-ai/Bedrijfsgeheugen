// Shared platform/api and platform/saas modules are part of this Netlify runtime bundle; production readback must treat their changes as deploy-relevant.
import {getUser} from '@netlify/identity';
import {handlePortalConnectorsRequest} from '../../platform/api/portal-connectors-handler.mjs';
import {createPortalConnectorsStore} from './_portal-connectors-store.mjs';
import {createConnectorRuntime,createEnvironmentConnectorProviders} from '../../platform/connectors/connector-runtime.mjs';
import {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';

const store=createPortalConnectorsStore();
const engine=createConnectorRuntime({providers:createEnvironmentConnectorProviders()});
const sovereignty=createDataSovereigntyClient();
export default async request=>handlePortalConnectorsRequest({request,user:await getUser(),store,engine,sovereignty});
// The base path is the tenant-scoped connector list/create endpoint; Netlify's URLPattern wildcard does not imply the base.
// Preserve exactly one existing handler and keep public readiness excluded from its authenticated scope.
export const config={path:['/api/connectors','/api/connectors/*'],excludedPath:'/api/connectors/readiness'};
