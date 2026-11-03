// BG Native Content Generator — approved OpenAI gpt-5-mini, governed source repair 2026-11-03
// Leest kandidaten uit de CENTRAAL-mediakalender (Genereren aan, geen kanaalteksten, niet geblokkeerd, geen testmodus)
// en schrijft kanaalteksten terug als CONCEPT. Publiceert nooit.
// v6: classificeert elke post (Hook type, CTA type). v7: waarheidspoort. v8: inhaakposts en Prioriteit Hoog eerst; body.page_id.
// v9: getallencontrole bij inhaakposts — elk getal in de tekst moet in de bron (Notities) staan. Aanleiding: "minder dan 10 medewerkers" verzonnen bij een subsidiepost.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON = 'bg-native-content-generate';
const USE_CASE = 'supabase-bg-native-content-generate-v4';
const NOTION_VERSION = '2025-09-03';
const DATA_SOURCE = Deno.env.get('NOTION_MEDIA_DATA_SOURCE_ID') || '626e4c3c-cfee-4390-b519-6a910538607d';
const RULE_MAX_AGE_H = 96;
const HOOK_TYPES = ['Herkenning', 'Verhaal', 'Cijfer', 'Contrair', 'Probleem', 'Vraag', 'Bekentenis'];
const CTA_TYPES = ['Vraag', 'Opslaan', 'Delen', 'DM', 'Scan', 'Afspraak', 'Aanbod', 'Geen'];
const VERZONNEN = /\b(ik sprak|sprak ik|ik zie bij veel|ik had (?:laatst|deze week|gisteren|vorige week)[^.]{0,40}(?:gesprek|klant|ondernemer|accountant)|een (?:klant|ondernemer|accountant|directeur|adviseur) (?:vertelde|zei|belde|mailde|vroeg)|vertelde (?:mij|me) (?:laatst|deze week)|in (?:onze |mijn )?gesprekken met|wij zien het regelmatig|we zien het (?:vaak|regelmatig) terug|onlangs bij een klant|bij een van onze klanten|laatst bij een klant)\b/i;
const ARTIKEL = /\b(lees het (?:volledige|hele) artikel|volledige artikel|lees (?:meer )?op (?:onze|de) (?:site|blog)|link in bio)\b/i;
const PRIO: Record<string, number> = { 'Hoog': 0, 'Midden': 1, 'Laag': 2 };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clean = (v: unknown) => String(v ?? '').trim();
const getallen = (s: unknown) => (String(s ?? '').match(/\d+(?:[.,]\d+)*/g) || []).map(n => n.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')).map(n => String(Number(n)));

function propText(p: any): string | null {
  if (!p) return null;
  switch (p.type) {
    case 'select': return p.select?.name?.trim() || null;
    case 'status': return p.status?.name?.trim() || null;
    case 'rich_text': return (p.rich_text || []).map((x: any) => x.plain_text || '').join('').trim() || null;
    case 'title': return (p.title || []).map((x: any) => x.plain_text || '').join('').trim() || null;
    case 'multi_select': return (p.multi_select || []).map((x: any) => x.name).filter(Boolean).join(', ') || null;
    case 'url': return p.url || null;
    default: return null;
  }
}

function candidateFromPage(page: any) {
  const p = page?.properties || {};
  if (p['Genereren']?.checkbox !== true) return null;
  if (p['Kanaalteksten gereed']?.checkbox === true) return null;
  if (propText(p['Publicatiecheck']) === 'Geblokkeerd') return null;
  if (p['Testmodus']?.checkbox === true) return null;
  const title = propText(p['Titel']);
  return { page_id: page.id, title, is_inhaak: /^Inhaken\b/i.test(title || ''), prioriteit: propText(p['Prioriteit']), hook: propText(p['Hook']), weektheme: propText(p['Weekthema']), weekconcept: propText(p['Weekbegrip']), act: propText(p['Akte']), channel_role: propText(p['Kanaalrol']), content_pillar: propText(p['Contentpijler']), goal: propText(p['Doel']), audience: propText(p['Doelgroep']), campaign: propText(p['Campagne']), hook_type: propText(p['Hook type']), cta_type: propText(p['CTA type']), media_type: propText(p['Media type']), entry_moment: propText(p['Instapmoment']), previous_cliffhanger: propText(p['Haakt aan op']), notes: propText(p['Notities']), has_blog: !!propText(p['Blogtekst']) || !!propText(p['SEO Slug']), link_in_comment: propText(p['Linkinreactie']) };
}

const rich = (t: string) => ({ rich_text: [{ type: 'text', text: { content: t.slice(0, 1990) } }] });
const select = (name: string) => ({ select: { name } });
const SCHEMA = { type: 'object', additionalProperties: false, properties: { mediaType: { type: 'string', enum: ['Afbeelding', 'Video', 'Tekst'] }, hook: { type: 'string', description: 'Maximaal acht woorden' }, hookType: { type: 'string', enum: HOOK_TYPES }, ctaType: { type: 'string', enum: CTA_TYPES }, caption: { type: 'string' }, cta: { type: 'string' }, linkedinPersonal: { type: 'string', description: 'Minimaal 500 tekens, ik-vorm, zonder verzonnen gesprekken of ervaringen' }, companyPost: { type: 'string', description: 'Wij-vorm, feitelijk, minimaal 40 woorden' }, instagram: { type: 'string', description: 'Minimaal 50 woorden' }, voice: { type: 'string', description: 'De letterlijk uitgesproken tekst voor een video van maximaal 30 seconden, geen regieaanwijzing' }, narrator: { type: 'string', enum: ['Man'] }, avatarHint: { type: 'string' }, cliffhanger: { type: 'string' }, hooksInto: { type: 'string' }, firstComment: { type: 'string' } }, required: ['mediaType', 'hook', 'hookType', 'ctaType', 'caption', 'cta', 'linkedinPersonal', 'companyPost', 'instagram', 'voice', 'narrator', 'avatarHint', 'cliffhanger', 'hooksInto', 'firstComment'] };

function problems(o: any, candidate: any): string[] {
  const out: string[] = []; const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  if (!o || !SCHEMA.required.every(k => typeof o[k] === 'string' && o[k].trim())) return ['onvolledig'];
  if (!['Afbeelding', 'Video', 'Tekst'].includes(o.mediaType)) out.push('mediaType');
  if (!HOOK_TYPES.includes(o.hookType) || !CTA_TYPES.includes(o.ctaType)) out.push('haaktype of CTA-type buiten de lijst');
  if (o.linkedinPersonal.length < 500) out.push('LinkedIn korter dan 500 tekens');
  if (words(o.companyPost) < 40) out.push('bedrijfspagina korter dan 40 woorden');
  if (words(o.instagram) < 50) out.push('Instagram korter dan 50 woorden');
  if (words(o.hook) > 8) out.push('hook langer dan acht woorden');
  const bron = `${candidate.notes || ''} ${candidate.hook || ''} ${candidate.title || ''}`;
  const teksten = ['linkedinPersonal', 'companyPost', 'instagram', 'caption', 'voice', 'firstComment', 'hook', 'cta'];
  for (const veld of teksten) { const m = String(o[veld]).match(VERZONNEN); if (m && !bron.toLowerCase().includes(m[0].toLowerCase())) out.push(`verzonnen ervaring in ${veld}: "${m[0]}"`); }
  if (!candidate.has_blog) for (const veld of ['cta', 'caption', 'instagram', 'linkedinPersonal', 'companyPost']) { const m = String(o[veld]).match(ARTIKEL); if (m) out.push(`verwijst naar een artikel dat niet bestaat in ${veld}: "${m[0]}"`); }
  if (candidate.is_inhaak) {
    const toegestaan = new Set(getallen(bron));
    for (const veld of teksten) { const vreemd = getallen(veld === 'firstComment' ? String(o[veld]).replace(/https?:\/\/\S+/g, '') : o[veld]).filter(n => !toegestaan.has(n)); if (vreemd.length) out.push(`getal dat niet in de bron staat in ${veld}: ${[...new Set(vreemd)].join(', ')}`); }
  }
  if (/^(nuchter|rustig|direct|toon|stem|spreek)\b/i.test(o.voice.trim()) || words(o.voice) < 25) out.push('voice is geen uitgesproken tekst');
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || ''; const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) return json({ ok: false, error: 'CONFIG' }, 500);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bewijs = (groen: boolean, detail: unknown, klasse: string | null = null) => db.rpc('bg_bewijs', { p_bron: BRON, p_groen: groen, p_detail: detail, p_foutklasse: klasse }).then(() => {}, () => {});
  const fail = async (status: number, body: Record<string, unknown>, klasse: string) => { await bewijs(false, body, klasse); return json({ ok: false, ...body }, status); };
  const secret = async (env: string, vault: string) => (Deno.env.get(env) || ((await db.rpc('bg_geheim', { p_naam: vault })).data as string) || '').trim();

  const { data: gov } = await db.from('brain_ai_governance_registry').select('model_id,lifecycle_status,approved,provider').eq('tenant_id', 'canonical').eq('use_case_id', USE_CASE).maybeSingle();
  if (!gov || gov.lifecycle_status !== 'ACTIVE' || gov.approved !== true || gov.provider !== 'OpenAI') return fail(403, { error: 'AI_USE_CASE_NOT_APPROVED', use_case: USE_CASE }, 'POLICY');
  const model = gov.model_id;
  const notionToken = await secret('NOTION_TOKEN', 'Notion');
  const openaiKey = await secret('OPENAI_API_KEY', 'OPENAI_API_KEY');
  if (!notionToken || !openaiKey) return fail(503, { error: 'CONFIG_UNAVAILABLE', missing: { notion: !notionToken, openai: !openaiKey } }, 'AUTH');
  const nh = { authorization: `Bearer ${notionToken}`, 'notion-version': NOTION_VERSION, 'content-type': 'application/json' };

  const { data: rules, error: ruleErr } = await db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status,bijgewerkt_op').order('vertrouwen', { ascending: false });
  if (ruleErr) return fail(503, { error: 'RULE_CONTEXT_UNAVAILABLE' }, 'REMOTE');
  const active = (rules || []).filter((r: any) => r.status === 'actief');
  if (!active.length) return fail(503, { error: 'RULE_CONTEXT_EMPTY' }, 'VALIDATION');
  const newest = Math.max(...active.map((r: any) => Date.parse(r.bijgewerkt_op || '')).filter(Number.isFinite));
  if (!Number.isFinite(newest) || Date.now() - newest > RULE_MAX_AGE_H * 3600_000) return fail(503, { error: 'RULE_CONTEXT_STALE' }, 'VALIDATION');
  const snapBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(active.map((r: any) => [r.regel_id, r.regel, r.vertrouwen, r.bijgewerkt_op]))));
  const snapshot = 'bg-rules:' + [...new Uint8Array(snapBytes)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);

  let body: any = {}; try { body = await req.json(); } catch { /* leeg */ }
  let candidate: any = null;
  if (body?.page_id) {
    const r = await fetch(`https://api.notion.com/v1/pages/${body.page_id}`, { headers: nh });
    const b: any = await r.json().catch(() => ({}));
    if (!r.ok) return fail(502, { error: `NOTION_${r.status}`, detail: clean(b?.message).slice(0, 200) }, 'REMOTE');
    candidate = candidateFromPage(b);
  } else {
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE}/query`, { method: 'POST', headers: nh, body: JSON.stringify({ page_size: 100, filter: { property: 'Genereren', checkbox: { equals: true } } }) });
    const b: any = await r.json().catch(() => ({}));
    if (!r.ok) return fail(502, { error: `NOTION_${r.status}`, detail: clean(b?.message).slice(0, 200) }, r.status === 404 || r.status === 401 ? 'AUTH' : 'REMOTE');
    const lijst = (b.results || []).map(candidateFromPage).filter(Boolean);
    lijst.sort((x: any, y: any) => (Number(y.is_inhaak) - Number(x.is_inhaak)) || ((PRIO[x.prioriteit] ?? 3) - (PRIO[y.prioriteit] ?? 3)));
    candidate = lijst[0] || null;
  }
  if (!candidate?.page_id) { await bewijs(true, { generated: false, reason: 'NO_GENERATION_CANDIDATE', model }); return json({ ok: true, generated: false, reason: 'NO_GENERATION_CANDIDATE' }); }

  const ruleText = active.map((r: any) => `- ${r.onderwerp}: ${r.regel} (vertrouwen ${Number(r.vertrouwen || 0).toFixed(2)})`).join('\n');
  const contextRules = (rules || []).filter((r: any) => r.status !== 'actief').map((r: any) => `- ${r.onderwerp}: ${r.regel} [${r.status}; alleen context]`).join('\n') || 'geen';
  const system = [
    'Je bent de Content Decision Engine van Bedrijfsgeheugen (digitalisering en AI voor het Nederlandse mkb). Je schrijft namens Arthur Prinsen.',
    'Schrijf in het Nederlands, kanaalspecifiek, niet copy-paste. Actieve schrijfregels zijn verplicht waar relevant; regels met te weinig bewijs zijn alleen context.',
    'WAARHEID: verzin nooit cijfers, klanten, personen, quotes, gesprekken, ontmoetingen of ervaringen. Schrijf dus niet "ik sprak deze week met", "ik zie bij veel", "een klant vertelde" of "wij zien het regelmatig terug", tenzij het letterlijk in de kandidaat staat. Gebruik een herkenbare situatie in de tweede persoon of een algemene waarneming.',
    candidate.is_inhaak ? 'Dit is een INHAAKPOST op actueel nieuws. Gebruik uitsluitend de feiten uit de notities (de externe bron): geen enkel getal, voorwaarde, doelgroepgrens of voorbeeld dat niet in de bron staat. Noem de bron met naam en datum. Maak de koppeling naar kennisborging, processen of digitalisering bij het mkb. De link naar de bron komt in de eerste reactie, niet in de post zelf.' : '',
    candidate.has_blog ? 'Bij dit item hoort een artikel; je mag ernaar verwijzen.' : 'Bij dit item hoort GEEN artikel of blog. Verwijs dus niet naar een artikel, "lees meer" of "link in bio". De call to action is een vraag, een DM of een scan.',
    'Hook maximaal acht woorden. De slotvraag vraagt om een concreet voorbeeld, niet om een mening, en richt zich op één type lezer.',
    'voice is de letterlijke gesproken tekst (25 tot 70 woorden), geen beschrijving van de toon.',
    'Classificeer eerlijk welk haaktype en welk CTA-type je tekst echt heeft. Lever uitsluitend via de tool bg_content.'
  ].filter(Boolean).join('\n');
  const user = `ACTIEVE SCHRIJFREGELS\n${ruleText}\n\nCONTEXT (ONVOLDOENDE BEWIJS)\n${contextRules}\n\nCONTENTKANDIDAAT\n${JSON.stringify(candidate)}`;

  let out: any = null, lastIssues: string[] = [], lastErr = '';
  for (let attempt = 1; attempt <= 3 && !out; attempt++) {
    const feedback = attempt === 1 ? '' : `\n\nJe vorige versie is afgekeurd om deze redenen: ${lastIssues.join('; ')}. Herschrijf zodat geen van deze problemen meer voorkomt.`;
    // Use only the currently approved governance provider/model; never route to Anthropic or another fallback.
    const ai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${openaiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        max_completion_tokens: 6500,
        messages: [
          { role: 'system', content: system + '\\nGeef uitsluitend een valide JSON-object met alle verplichte velden.' },
          { role: 'user', content: user + feedback }
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'bg_content', strict: true, schema: SCHEMA } }
      })
    });
    const aiBody: any = await ai.json().catch(() => ({}));
    if (!ai.ok) { lastErr = `AI_${ai.status}: ${clean(aiBody?.error?.message).slice(0, 200)}`; break; }
    const message = aiBody?.choices?.[0]?.message;
    if (message?.refusal) { lastErr = 'AI_REFUSAL'; break; }
    let parsed: any = null;
    try { parsed = JSON.parse(String(message?.content || '')); } catch { lastErr = 'AI_JSON_INVALID'; }
    const issues = problems(parsed, candidate);
    if (!issues.length) out = parsed; else { lastIssues = issues; lastErr = lastErr || 'AI_OUTPUT_CONTRACT_FAILED'; }
  }
  if (!out) return fail(503, { error: lastErr, issues: lastIssues, notion_page_id: candidate.page_id, model }, /AI_40[13]/.test(lastErr) ? 'AUTH' : 'VALIDATION');

  const properties: Record<string, any> = { 'Hook': rich(out.hook), 'Hook type': select(out.hookType), 'CTA type': select(out.ctaType), 'Caption': rich(out.caption), 'Call to action': rich(out.cta), 'LinkedIn-tekst': rich(out.linkedinPersonal), 'Bedrijfspagina-tekst': rich(out.companyPost), 'Instagram-tekst': rich(out.instagram), 'Voice text': rich(out.voice), 'Avatar-aanwijzing': rich(out.avatarHint), 'Cliffhanger': rich(out.cliffhanger), 'Haakt aan op': rich(out.hooksInto), 'Eerste reactie tekst': rich(out.firstComment), 'Media type': select(out.mediaType), 'Verteller': select(out.narrator), 'Kanaalteksten gereed': { checkbox: true }, 'Genereren': { checkbox: false }, 'AI-toelichting': rich(`Concept door ${model} (use case ${USE_CASE}); schrijfregels ${snapshot}; haaktype ${out.hookType}, CTA ${out.ctaType}; waarheidspoort doorstaan${candidate.is_inhaak ? ' incl. getallencontrole tegen de bron' : ''}. Nog niet goedgekeurd voor publicatie.`) };
  const w = await fetch(`https://api.notion.com/v1/pages/${candidate.page_id}`, { method: 'PATCH', headers: nh, body: JSON.stringify({ properties }) });
  if (!w.ok) { const wb: any = await w.json().catch(() => ({})); return fail(502, { error: `NOTION_WRITE_${w.status}`, detail: clean(wb?.message).slice(0, 200) }, 'REMOTE'); }
  const res = { generated: true, notion_page_id: candidate.page_id, is_inhaak: candidate.is_inhaak, model, use_case: USE_CASE, rule_snapshot: snapshot, hook_type: out.hookType, cta_type: out.ctaType };
  await bewijs(true, res);
  return json({ ok: true, ...res });
});
