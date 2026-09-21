import { runTranslation } from './_brain-ai.mjs';

const MAX_ITEMS = 60;
const MAX_CHARS = 8000;

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({error:'translation_unavailable'},{status:503});
  try {
    const result = await runTranslation({strings:clean,source,target,dataClass,apiKey});
    return Response.json({translations:result.translations});
  } catch {
    return Response.json({error:'translation_failed'},{status:502});
  }
};
export const config = { path:'/api/i18n-translate' };