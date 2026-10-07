import { getUser } from '@netlify/identity';\nimport {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';\nimport {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';\nimport { runTranslation } from './_brain-ai.mjs';

const MAX_ITEMS = 60;
const MAX_CHARS = 8000;\nconst sovereignty=createDataSovereigntyClient();

export default async (request) => {
  if (request.method !== 'POST') return new Response('POST only',{status:405});
  let body;
  try { body = await request.json(); } catch { return Response.json({error:'invalid_json'},{status:400}); }
  const strings = Array.isArray(body.strings) ? body.strings : [];
  const target = body.target === 'en' ? 'en' : body.target === 'nl' ? 'nl' : null;
  const source = body.source === 'en' ? 'en' : 'nl';
  const dataClass = body.context === 'portal' ? 'Confidential' : 'Public';
  if (!target || target === source || !strings.length || strings.length > MAX_ITEMS) return Response.json({error:'invalid_request'},{status:400});
  const clean = strings.map(value=>String(value ?? '').trim()).filter(Boolean);
  if (clean.reduce((n,s)=>n+s.length,0) > MAX_CHARS) return Response.json({error:'request_too_large'},{status:413});
  if(dataClass==='Confidential'){\n    const user=await getUser(request);\n    if(!user?.id)return Response.json({error:'unauthorized'},{status:401});\n    const tenantId=resolveIdentityTenant(user);\n    try{await sovereignty.assertAiAllowed(tenantId);}catch(error){if(error?.code==='DATA_SOVEREIGNTY_AI_BLOCKED')return Response.json({error:error.code},{status:409});throw error;}\n  }\n  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({error:'translation_unavailable'},{status:503});
  try {
    const result = await runTranslation({strings:clean,source,target,dataClass,apiKey});
    return Response.json({translations:result.translations});
  } catch {
    return Response.json({error:'translation_failed'},{status:502});
  }
};
export const config = { path:'/api/i18n-translate', region:'fra' };