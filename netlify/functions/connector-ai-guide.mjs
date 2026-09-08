import {getUser} from '@netlify/identity';
import {createConnectorAiGuideHandler} from '../../platform/api/connector-ai-guide-handler.mjs';
import {proposeConnectorConfiguration} from './_connector-ai.mjs';

const handler=createConnectorAiGuideHandler({
  getUser,
  propose:input=>proposeConnectorConfiguration(input)
});

export default async request=>handler(request);
export const config={path:'/api/connectors/guide'};
