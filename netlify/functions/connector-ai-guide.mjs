import {getUser} from '@netlify/identity';
import {createConnectorAiGuideHandler} from '../../platform/api/connector-ai-guide-handler.mjs';
import {proposeConnectorConfiguration} from './_connector-ai.mjs';\nimport {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';\nimport {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';

const sovereignty=createDataSovereigntyClient();\nconst handler=createConnectorAiGuideHandler({
  getUser,
  propose:input=>proposeConnectorConfiguration(input)
});

export default async request=>handler(request);
export const config={path:'/api/connectors/guide'};
