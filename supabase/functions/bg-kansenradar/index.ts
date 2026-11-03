// BG Kansenradar — v4, 10 sept 2026. Als eerste inspringen op wat er buiten gebeurt.
// INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
// Original bg_bewijs RED receipts remain canonical; keep source owner diagnosis,
// guarded retry, exact regression and provider outcome before any GREEN claim.
// 1. Kandidaten: externe signalen (Tavily) die toegestaan zijn, max 5 dagen oud, nog niet gebruikt.
// 2. Claude (use case supabase-bg-kansenradar-v1) toetst: echt nieuws? relevant? segmenten? haak? urgentie? deadline?
// 3. Beste signaal -> inhaakpost in de mediakalender (publicatie morgen). De generator schrijft (06:10 UTC).
// 4. Beste signaal -> inhaak-DM's via public.bg_inhaak_kandidaten() (Nederlandse doelgroep), max 5 per dag, 2 per segment.
// 5. Deadline-kalender: goedgekeurd signaal met einddatum > 10 dagen krijgt een herinneringspost 14 dagen vóór de deadline.
//    v4: ontdubbeld — zelfde onderwerp + zelfde deadline = één herinnering (meerdere sites over dezelfde regeling).
// Nooit versturen of publiceren: alles komt als concept bij Arthur. Sleutels: Vault. Bewijs: public.bg_bewijs.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON = 'bg-kansenradar';
const USE_CASE = 'supabase-bg-kansenradar-v1';
const NV = '2025-09-03';
const MEDIA_DS = Deno.env.get('NOTION_MEDIA_DATA_SOURCE_ID') || '626e4c3c-cfee-4390-b519-6a910538607d';
const MAX_DM_PER_DAG = 5;
const VERZONNEN = /\b(ik sprak|sprak ik|een (?:klant|ondernemer|accountant|directeur|adviseur) (?:vertelde|zei|belde|mailde|vroeg)|in (?:onze |mijn )?gesprekken met|wij zien het regelmatig|onlangs bij een klant|bij een van onze klanten|laatst bij een klant)\b/i;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const dag = (t: number) => new Date(t).toISOString().slice(0, 10);

async function openai(key: string, model: string, system: string, user: string, name: string, schema: any) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model, max_completion_tokens: 5500,
      messages: [
        { role: 'system', content: system + '\\nLever alleen de velden uit het originele function-schema. Geen wrapper met de functienaam; geen feiten buiten de bron.' },
        { role: 'user', content: user }
      ],
      tools: [{ type: 'function', function: { name, description: name, parameters: schema } }],
      tool_choice: { type: 'function', function: { name } },
      parallel_tool_calls: false
    }),
    signal: AbortSignal.timeout(60000)
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OPENAI_${response.status}: ${String(body?.error?.message || '').slice(0, 160)}`);
  const message = body?.choices?.[0]?.message;
  if (message?.refusal) throw new Error('OPENAI_REFUSAL');
  let parsed: any;
  const args = (message?.tool_calls || []).find((call: any) => call?.type === 'function' && call?.function?.name === name)?.function?.arguments;
  if (typeof args !== 'string' || !args.length) throw new Error('OPENAI_TOOL_RESULT_MISSING');
  try { parsed = JSON.parse(args); } catch { throw new Error('OPENAI_OUTPUT_NOT_JSON'); }
  const fields = Array.isArray(schema?.required) ? schema.required : [];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
    || fields.some((field: string) => !(field in parsed))
    || (name === 'toets' && !Array.isArray(parsed.oordelen))
    || (name === 'dm' && !Array.isArray(parsed.berichten)))
      throw new Error('OPENAI_OUTPUT_CONTRACT_FAILED');
  return parsed;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!; const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bewijs = (groen: boolean, detail: unknown, klasse: string | null = null) => db.rpc('bg_bewijs', { p_bron: BRON, p_groen: groen, p_detail: detail, p_foutklasse: klasse }).then(() => {}, () => {});
  const geheim = async (n: string) => (((await db.rpc('bg_geheim', { p_naam: n })).data as string) || '').trim();
  const fail = async (s: number, b: Record<string, unknown>, k: string) => { await bewijs(false, b, k); return json({ ok: false, ...b }, s); };

  const { data: gov } = await db.from('brain_ai_governance_registry').select('model_id,lifecycle_status,approved,provider').eq('tenant_id', 'canonical').eq('use_case_id', USE_CASE).maybeSingle();
  if (!gov || gov.lifecycle_status !== 'ACTIVE' || gov.approved !== true || gov.provider !== 'OpenAI') return fail(403, { error: 'AI_USE_CASE_NOT_APPROVED' }, 'POLICY');
  // Source-backed OpenAI-only owner directive. No Anthropic fallback or credit-side effects.
  const model = gov.model_id;
  const ak = Deno.env.get('OPENAI_API_KEY') || await geheim('OPENAI_API_KEY');
  const notion = Deno.env.get('NOTION_TOKEN') || await geheim('Notion');
  if (!ak || !notion) return fail(503, { error: 'CONFIG_UNAVAILABLE', missing: { openai: !ak, notion: !notion } }, 'AUTH');
  const nh = { authorization: `Bearer ${notion}`, 'notion-version': NV, 'content-type': 'application/json' };
  let body: any = {}; try { body = await req.json(); } catch { /* leeg */ }

  const nieuwItem = async (titel: string, notities: string, publicatie: string, bronUrl: string, pijler?: string) => {
    const props: any = { 'Titel': { title: [{ text: { content: titel.slice(0, 180) } }] }, 'Notities': { rich_text: [{ text: { content: notities.slice(0, 1990) } }] }, 'Genereren': { checkbox: true }, 'Platform': { multi_select: [{ name: 'LinkedIn' }] }, 'Doel': { select: { name: 'Vertrouwen' } }, 'Contenttype': { select: { name: 'Post' } }, 'Media type': { select: { name: 'Tekst' } }, 'Prioriteit': { select: { name: 'Hoog' } }, 'Publicatiedatum': { date: { start: publicatie } }, 'Linkinreactie': { url: bronUrl } };
    if (pijler) props['Contentpijler'] = { select: { name: pijler } };
    const w = await fetch('https://api.notion.com/v1/pages', { method: 'POST', headers: nh, body: JSON.stringify({ parent: { type: 'data_source_id', data_source_id: MEDIA_DS }, properties: props }) });
    const wb: any = await w.json().catch(() => ({}));
    if (!w.ok) throw new Error(`NOTION_POST_${w.status}: ${String(wb?.message || '').slice(0, 160)}`);
    return wb.id as string;
  };

  try {
    const { data: onderwerpen } = await db.from('bg_signaal_onderwerpen').select('onderwerp,segmenten,contentpijler');
    const ow = new Map((onderwerpen || []).map((o: any) => [o.onderwerp, o]));
    let q = db.from('bg_externe_signalen').select('url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,vertrouwen,gebruikt_post_notion_id,gebruikt_dm_op,deadline,deadline_post_notion_id').eq('toegestaan', true).gte('gepubliceerd_op', new Date(Date.now() - 5 * 86400000).toISOString()).order('vertrouwen', { ascending: false }).limit(8);
    q = body?.alleen_dm ? q.is('gebruikt_dm_op', null) : body?.alleen_deadline ? q.is('deadline_post_notion_id', null) : q.is('gebruikt_post_notion_id', null);
    const { data: kand } = await q;
    if (!kand?.length) { await bewijs(true, { kansen: 0, reden: 'GEEN_VERSE_SIGNALEN' }); return json({ ok: true, kansen: 0, reden: 'GEEN_VERSE_SIGNALEN' }); }

    const seg = ['Directeur / eigenaar', 'Recruitment & HR', 'Advies & consultancy', 'IT & data', 'Investeerder', 'Overdracht & M&A', 'Accountant & fiscaal', 'Marketing & sales'];
    const toetsSchema = { type: 'object', properties: { oordelen: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, echt_nieuws: { type: 'boolean', description: 'Waar als het een actueel bericht, besluit, regeling, onderzoek of marktontwikkeling is. Onwaar voor productpagina, leveranciersblog, lijstje, bedrijfsprofiel of evergreen uitleg.' }, relevant: { type: 'boolean', description: 'Waar als een Nederlandse mkb-directeur (3-250 medewerkers) hier deze week iets mee moet of wil' }, segmenten: { type: 'array', items: { type: 'string' } }, haak: { type: 'string', description: 'Eén zin: het feit uit de bron waarop je inhaakt, zonder iets toe te voegen' }, urgentie: { type: 'number', description: '0-1: hoe tijdgebonden (deadline, nieuwe regel, net verschenen)' }, deadline: { type: 'string', description: 'Einddatum van een regeling, aanvraagtermijn of wettelijke verplichting als YYYY-MM-DD, alleen als die letterlijk in de bron staat. Anders leeg.' } }, required: ['url', 'echt_nieuws', 'relevant', 'segmenten', 'haak', 'urgentie', 'deadline'] } } }, required: ['oordelen'] };
    const toets = await openai(ak, model, `Je bent de kansenradar van Bedrijfsgeheugen (digitalisering, kennisborging en AI voor het Nederlandse mkb). Vandaag is ${dag(Date.now())}. Beoordeel streng en eerlijk. Gebruik alleen wat in de bron staat.`, `Beoordeel deze signalen. Kies segmenten uitsluitend uit: ${seg.join(', ')}.\n\n${JSON.stringify(kand.map(k => ({ url: k.url, onderwerp: k.onderwerp, titel: k.titel, bron: k.domein, datum: k.gepubliceerd_op, samenvatting: String(k.samenvatting || '').slice(0, 900) })))}`, 'toets', toetsSchema);
    const oordelen: any[] = toets?.oordelen || [];
    const goed = kand.map(k => ({ ...k, o: oordelen.find(o => o.url === k.url) })).filter(k => k.o?.echt_nieuws && k.o?.relevant).sort((a, b) => (b.vertrouwen * 0.6 + b.o.urgentie * 0.4) - (a.vertrouwen * 0.6 + a.o.urgentie * 0.4));
    for (const k of kand) { const o = oordelen.find(x => x.url === k.url); if (o && !(o.echt_nieuws && o.relevant)) await db.from('bg_externe_signalen').update({ toegestaan: false, ruis_reden: o.echt_nieuws ? 'niet relevant (kansenradar)' : 'geen nieuws (kansenradar)' }).eq('url', k.url); }
    if (!goed.length) { const r = { ok: true, kansen: 0, beoordeeld: kand.length, reden: 'NIETS_DOOR_DE_TOETS' }; await bewijs(true, r); return json(r); }

    const herinneringen: string[] = [];
    for (const k of goed) {
      const dl = /^\d{4}-\d{2}-\d{2}$/.test(k.o.deadline || '') ? k.o.deadline : null;
      if (!dl) continue;
      await db.from('bg_externe_signalen').update({ deadline: dl }).eq('url', k.url);
      const t = Date.parse(dl); if (!Number.isFinite(t) || t < Date.now() + 10 * 86400000 || k.deadline_post_notion_id || body?.deadline === false) continue;
      const { data: al } = await db.from('bg_externe_signalen').select('url').eq('deadline', dl).eq('onderwerp', k.onderwerp).not('deadline_post_notion_id', 'is', null).neq('url', k.url).limit(1);
      if (al?.length) { await db.from('bg_externe_signalen').update({ deadline_post_notion_id: `dubbel:${al[0].url}` }).eq('url', k.url); continue; }
      const publicatie = dag(Math.max(t - 14 * 86400000, Date.now() + 2 * 86400000));
      const meta: any = ow.get(k.onderwerp) || {};
      const datum = k.gepubliceerd_op ? dag(Date.parse(k.gepubliceerd_op)) : '';
      const id = await nieuwItem(`Inhaken — Herinnering: ${String(k.titel).slice(0, 100)} (deadline ${dl})`, `INHAAKPOST — HERINNERING. De termijn sluit op ${dl}. Wijs erop dat er nog ongeveer twee weken zijn. Gebruik uitsluitend feiten uit deze bron en noem de bron (${k.domein}, ${datum}).\nHaak: ${k.o.haak}\nBron-samenvatting: ${String(k.samenvatting || '').slice(0, 1000)}\nBron: ${k.url}`, publicatie, k.url, meta.contentpijler);
      await db.from('bg_externe_signalen').update({ deadline_post_notion_id: id }).eq('url', k.url);
      herinneringen.push(`${k.titel} → post op ${publicatie}`);
    }
    if (body?.alleen_deadline) { const r = { ok: true, herinneringen }; await bewijs(true, r); return json(r); }

    const top = goed[0]; const o = top.o; const meta: any = ow.get(top.onderwerp) || { segmenten: [], contentpijler: 'Automatisering' };
    const datum = top.gepubliceerd_op ? dag(Date.parse(top.gepubliceerd_op)) : '';
    let postId: string | null = top.gebruikt_post_notion_id || null;
    if (body?.post !== false && !postId) {
      postId = await nieuwItem(`Inhaken — ${String(top.titel).slice(0, 120)}`, `INHAAKPOST — reageer als eerste op dit nieuws. Gebruik uitsluitend feiten uit deze bron en noem de bron (${top.domein}, ${datum}).\nHaak: ${o.haak}\nBron-samenvatting: ${String(top.samenvatting || '').slice(0, 1100)}\nBron: ${top.url}`, dag(Date.now() + 86400000), top.url, meta.contentpijler);
      await db.from('bg_externe_signalen').update({ gebruikt_post_notion_id: postId }).eq('url', top.url);
    }

    const segmenten = [...new Set([...(o.segmenten || []), ...(meta.segmenten || [])])].filter(s => seg.includes(s)).slice(0, 3);
    let dms = 0; const gekozenNamen: string[] = [];
    if (body?.dm !== false && segmenten.length && !top.gebruikt_dm_op) {
      const dmSchema = { type: 'object', properties: { berichten: { type: 'array', items: { type: 'object', properties: { segment: { type: 'string' }, tekst: { type: 'string', description: 'LinkedIn-DM, 40-75 woorden, begint letterlijk met "Hoi {voornaam},", noemt het nieuws met de bron, eindigt met één concrete vraag over hun eigen situatie. Geen link, geen verkooppraat, geen verzonnen ervaringen. Per segment een eigen invalshoek.' } }, required: ['segment', 'tekst'] } } }, required: ['berichten'] };
      const dm = await openai(ak, model, 'Je schrijft namens Arthur Prinsen (Bedrijfsgeheugen) korte, menselijke LinkedIn-berichten aan eerstegraads connecties in Nederland. Kort, kalm, niet-verdedigend, warm maar met gezag. Nooit verzinnen dat je iemand sprak of iets zag bij een klant.', `Nieuws: ${top.titel} (${top.domein}, ${datum}).\nHaak: ${o.haak}\nSchrijf één bericht per segment, elk met een eigen invalshoek voor dat segment: ${segmenten.join(', ')}.`, 'dm', dmSchema);
      const perSeg = new Map<string, string>((dm?.berichten || []).filter((b: any) => b?.tekst && b.tekst.includes('{voornaam}') && !VERZONNEN.test(b.tekst) && !/https?:\/\//.test(b.tekst)).map((b: any) => [b.segment, b.tekst]));
      const { data: con, error: ce } = await db.rpc('bg_inhaak_kandidaten', { p_segmenten: [...perSeg.keys()], p_limiet: 60 });
      if (ce) throw new Error('KANDIDATEN: ' + ce.message);
      const gekozen: any[] = []; const tel = new Map<string, number>();
      for (const c of con || []) { if (gekozen.length >= MAX_DM_PER_DAG) break; const n = tel.get(c.segment) || 0; if (n >= 2) continue; tel.set(c.segment, n + 1); gekozen.push(c); }
      for (const c of gekozen) {
        const voornaam = String(c.naam || '').trim().split(/\s+/)[0] || 'daar';
        const { error } = await db.from('powerhouse_sales_actions').insert({ dedupe_key: `inhaak:${top.url}:${c.linkedin_url}`, subject_key: c.linkedin_url, person_name: c.naam, company_name: c.bedrijf, role: c.rol, action_type: 'inhaak_nieuws', channel: 'LinkedIn DM', priority: Number(c.score || 50) + 15, reason: `Inhaken op nieuws: ${String(top.titel).slice(0, 120)} (${top.domein}, ${datum})`, evidence: { signaal_url: top.url, vertrouwen: top.vertrouwen, urgentie: o.urgentie, haak: o.haak }, message_draft: perSeg.get(c.segment)!.replaceAll('{voornaam}', voornaam), status: 'suggested', due_at: new Date().toISOString(), topic_key: top.onderwerp });
        if (!error) { dms++; gekozenNamen.push(`${c.naam} (${c.segment})`); await db.from('bg_connecties').update({ laatst_aangeboden_op: new Date().toISOString() }).eq('linkedin_url', c.linkedin_url); }
      }
      await db.from('bg_externe_signalen').update({ gebruikt_dm_op: new Date().toISOString() }).eq('url', top.url);
    }

    const res = { ok: true, beoordeeld: kand.length, door_toets: goed.length, signaal: { titel: top.titel, bron: top.domein, datum, haak: o.haak, segmenten }, inhaakpost_notion_id: postId, inhaak_dms: dms, ontvangers: gekozenNamen, herinneringen };
    await bewijs(true, res);
    return json(res);
  } catch (e: any) {
    return fail(500, { error: String(e?.message || e).slice(0, 300) }, /OPENAI_40[13]|NOTION_POST_40[134]/.test(String(e?.message)) ? 'AUTH' : 'VALIDATION');
  }
});
