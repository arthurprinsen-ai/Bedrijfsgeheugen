import {createDocumentExtractorHandler} from '../../platform/connectors/document-extractor-provider.mjs';

export default async request=>{
  const handler=createDocumentExtractorHandler({
    anthropicApiKey:Netlify.env.get('ANTHROPIC_API_KEY')||'',
    safeTestToken:Netlify.env.get('CONNECTOR_SAFE_TEST_TOKEN')||''
  });
  return handler(request);
};

export const config={path:'/api/connectors/document-extractor'};
