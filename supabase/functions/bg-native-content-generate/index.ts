import { createClient } from 'npm:@supabase/supabase-js@2';

const NOTION_VERSION = '2025-09-03';
const DEFAULT_DATA_SOURCE = '626e4c3c-cfee-4390-b519-6a910538607d';
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clean = (v: unknown) => String(v ?? '').trim();

function propText(prop: any): string | null {
  if (!prop) return null;
  if (prop.type === 'select') return prop.select?.name?.trim() || null;
  if (prop.type === 'status') return prop.status?.name?.trim() || null;
  if (prop.type === 'rich_text') return (prop.rich_text || []).map((x: any) => x.plain_text || '').join('').trim() || null;
  if (prop.type === 'title') return (prop.title || []).map((x: any) => x.plain_text || '').join('').trim() || null;
  if (prop.type === 'checkbox') return prop.checkbox ? 'true' : 'false';
  if (prop.type === 'multi_select') return (prop.multi_select || []).map((x: any) => x.name).filter(Boolean).join(', ') || null;
  return null;
}

async function notionQuery(token: string, dataSource: string) {
  const res = await fetch(`https://api.notion.com/v1/data_sources/${dataSource}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'notion-version': NOTION_VERSION, 'content-type': 'application/json' },
    body: JSON.stringify({ page_size: 100 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`NOTION_QUERY_${res.status}:${clean(body?.message).slice(0, 160)}`);
  return Array.isArray(body?.results) ? body.results : [];
}

function candidateFromPage(page: any) {
  const p = page?.properties || {};
  const generate = p['Genereren']?.type === 'checkbox' && p['Genereren']?.checkbox === true;
  const ready = propText(p['Kanaalteksten gereed']) === 'true';
  const pubCheck = propText(p['Publicatiecheck']);
  if (!generate || ready || pubCheck === 'Geblokkeerd') return null;
  return {
    page_id: page.id,
    title: propText(p['Titel']),
    hook: propText(p['Hook']),
    weektheme: propText(p['Weekthema']),
    weekconcept: propText(p['Weekbegrip']),
    act: propText(p['Akte']),
    channel_role: propText(p['Kanaalrol']),
    content_pillar: propText(p['Contentpijler']),
    goal: propText(p['Doel']),
    audience: propText(p['Doelgroep']),
    campaign: propText(p['Campagne']),
    hook_type: propText(p['Hook type']),
    cta_type: propText(p['CTA type']),
    media_type: propText(p['Media type']),
  };
}

const rich = (text: string) => ({ rich_text: [{ type: 'text', text: { content: text.slice(0, 1900) } }] });
const select = (name: string) => ({ select: { name } });

async function notionWrite(token: string, pageId: string, out: any) {
  const properties: Record<string, any> = {
    'Hook': rich(out.hook),
    'Caption': rich(out.caption),
    'Call to action': rich(out.cta),
    'LinkedIn-tekst': rich(out.linkedinPersonal),
    'Bedrijfspagina-tekst': rich(out.companyPost),
    'Instagram-tekst': rich(out.instagram),
    'Voice text': rich(out.voice),
    'Avatar-aanwijzing': rich(out.avatarHint),
    'Cliffhanger': rich(out.cliffhanger),
    'Haakt aan op': rich(out.hooksInto),
    'Eerste reactie tekst': rich(out.firstComment),
    'Media type': select(out.mediaType),
    'Verteller': select(out.narrator),
    'Kanaalteksten gereed': { checkbox: true },
    'Genereren': { checkbox: false },
    'AI-toelichting': rich(`Native Supabase generator; Brain-rules snapshot ${out.ruleSnapshot}.`),
  };
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'notion-version': NOTION_VERSION, 'content-type': 'application/json' },
    body: JSON.stringify({ properties }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`NOTION_WRITE_${res.status}:${clean(body?.message).slice(0, 180)}`);
}

function valid(out: any) {
  const keys = ['mediaType','hook','caption','cta','linkedinPersonal','companyPost','instagram','voice','narrator','avatarHint','cliffhanger','hooksInto','firstComment'];
  return out && keys.every(k => typeof out[k] === 'string') && ['Afbeelding','Video','Tekst'].includes(out.mediaType) && out.narrator === 'Man' && out.linkedinPersonal.length >= 500 && out.companyPost.split(/\s+/).filter(Boolean).length >= 40 && out.instagram.split(/\s+/).filter(Boolean).length >= 50;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const notionToken = Deno.env.get('NOTION_TOKEN') || '';
  const openaiKey = Deno.env.get('OPENAI_API_KEY') || '';
  const dataSource = Deno.env.get('NOTION_MEDIA_DATA_SOURCE_ID') || DEFAULT_DATA_SOURCE;
  const model = Deno.env.get('BG_CONTENT_MODEL') || 'gpt-5';
  if (!supabaseUrl || !serviceKey || !notionToken || !openaiKey) return json({ ok: false, error: 'NATIVE_GENERATOR_CONFIG_UNAVAILABLE', missing: { supabase: !supabaseUrl || !serviceKey, notion: !notionToken, openai: !openaiKey } }, 503);
  const callerAuthorization = req.headers.get('authorization') || '';
  if (callerAuthorization !== `Bearer ${serviceKey}`) {
    return json({ ok: false, error: 'SERVICE_ROLE_REQUIRED' }, 401);
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rules, error: ruleError } = await db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bijgewerkt_op').order('vertrouwen', { ascending: false });
  if (ruleError) return json({ ok: false, error: 'RULE_CONTEXT_UNAVAILABLE' }, 503);
  const active = (rules || []).filter((r: any) => r.status === 'actief');
  if (!active.length) return json({ ok: false, error: 'RULE_CONTEXT_EMPTY' }, 503);
  const newest = Math.max(...active.map((r: any) => new Date(r.bijgewerkt_op || 0).getTime()).filter(Number.isFinite));
  if (!Number.isFinite(newest) || Date.now() - newest > 48 * 3600_000) return json({ ok: false, error: 'RULE_CONTEXT_STALE', newest: Number.isFinite(newest) ? new Date(newest).toISOString() : null }, 503);
  const snapshotBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(active.map((r:any)=>[r.regel_id,r.regel,r.vertrouwen,r.bijgewerkt_op]))));
  const snapshot = [...new Uint8Array(snapshotBytes)].map(b => b.toString(16).padStart(2,'0')).join('').slice(0,24);

  let requested: any = {}; try { requested = await req.json(); } catch {}
  let candidate = requested?.candidate || null;
  if (!candidate) {
    const pages = await notionQuery(notionToken, dataSource);
    candidate = pages.map(candidateFromPage).filter(Boolean)[0] || null;
  }
  if (!candidate?.page_id) return json({ ok: true, generated: false, reason: 'NO_GENERATION_CANDIDATE' }, 200);

  const ruleText = active.map((r: any) => `- ${r.onderwerp}: ${r.regel} (confidence ${Number(r.vertrouwen || 0).toFixed(2)})`).join('\n');
  const contextRules = (rules || []).filter((r:any)=>r.status !== 'actief').map((r:any)=>`- ${r.onderwerp}: ${r.regel} [${r.status}; context only]`).join('\n');
  const instructions = `Je bent de native Content Decision Engine van Bedrijfsgeheugen. Brain-regels zijn verplichte schrijfcontext. Verzin nooit cijfers, klanten, personen, quotes, gesprekken of ervaringen. Actieve regels moeten aantoonbaar worden toegepast waar relevant. Regels met onvoldoende bewijs zijn alleen context en nooit een harde instructie. Schrijf kanaalspecifiek, niet copy-paste. Optimaliseer voor relevante conversaties, vertrouwen, gekwalificeerde leads en omzet; bereik is ondersteunend. Geef uitsluitend geldige JSON volgens het schema.`;
  const input = `ACTIEVE BRAIN-REGELS\n${ruleText}\n\nCONTEXT MET ONVOLDOENDE BEWIJS\n${contextRules || 'geen'}\n\nCONTENTKANDIDAAT\n${JSON.stringify(candidate)}`;
  const schema = {
    type: 'object', additionalProperties: false,
    properties: {
      mediaType:{type:'string',enum:['Afbeelding','Video','Tekst']}, hook:{type:'string'}, caption:{type:'string'}, cta:{type:'string'},
      linkedinPersonal:{type:'string'}, companyPost:{type:'string'}, instagram:{type:'string'}, voice:{type:'string'}, narrator:{type:'string',enum:['Man']},
      avatarHint:{type:'string'}, cliffhanger:{type:'string'}, hooksInto:{type:'string'}, firstComment:{type:'string'}
    },
    required:['mediaType','hook','caption','cta','linkedinPersonal','companyPost','instagram','voice','narrator','avatarHint','cliffhanger','hooksInto','firstComment']
  };
  const ai = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${openaiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, instructions, input, store: false, text: { format: { type: 'json_schema', name: 'bg_content', strict: true, schema } } }),
  });
  const aiBody = await ai.json().catch(() => ({}));
  if (!ai.ok) return json({ ok: false, error: 'AI_GENERATION_FAILED', status: ai.status, detail: clean(aiBody?.error?.message).slice(0,220) }, 503);
  const outputText = clean(aiBody?.output_text) || clean(aiBody?.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==='output_text')?.text);
  let out: any; try { out = JSON.parse(outputText); } catch { return json({ ok:false, error:'AI_OUTPUT_INVALID_JSON' }, 503); }
  if (!valid(out)) return json({ ok:false, error:'AI_OUTPUT_CONTRACT_FAILED' }, 503);
  out.ruleSnapshot = `bg-rules:${snapshot}`;

  await notionWrite(notionToken, candidate.page_id, out);
  await db.from('brain_delivery_evidence').insert({
    evidence_id: crypto.randomUUID(),
    source: 'bg-native-content-generate',
    status: 'PASS',
    payload: { notion_page_id: candidate.page_id, rule_snapshot: out.ruleSnapshot, model, generated_at: new Date().toISOString() },
  }).then(()=>{}).catch(()=>{});
  return json({ ok: true, generated: true, notion_page_id: candidate.page_id, rule_snapshot: out.ruleSnapshot, model }, 200);
});
