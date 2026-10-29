// BG Bedrijfsnieuws — v3, 10 sept 2026. Zakelijk nieuws over bedrijven van connecties als aanleiding voor een gesprek.
// v2: bedrijfsnaam opgeschoond, venster 60 dagen, 15 bedrijven per dag.
// v3: eigen datumfilter (Tavily respecteert 'days' niet altijd); per bericht de reden van afwijzen en de DM vastgelegd;
//     body.alleen = [bedrijfsnamen] om gericht te toetsen.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON = 'bg-bedrijfsnieuws';
const USE_CASE = 'supabase-bg-kansenradar-v1';
const MAX_BEDRIJVEN = 15, MAX_DM = 3, MIN_ZEKERHEID = 0.8, DAGEN = 60;
const SOCIAAL = /(^|\.)(instagram|facebook|tiktok|x|twitter|youtube|pinterest|reddit|linkedin)\.com$/i;
const VERZONNEN = /\b(ik sprak|sprak ik|een (?:klant|ondernemer|accountant|directeur) (?:vertelde|zei)|in (?:onze |mijn )?gesprekken met|wij zien het regelmatig|bij een van onze klanten)\b/i;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const domeinVan = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const schoon = (b: string) => String(b).split(/\s[|–—-]\s|\||_/)[0].replace(/\s+(b\.?v\.?|n\.?v\.?)\s*$/i, '').trim();
const kern = (b: string) => b.toLowerCase().replace(/\b(b\.?v\.?|n\.?v\.?|holding|groep|group|nederland|the netherlands|bv)\b/g, '').replace(/[^a-z0-9&\- ]/g, ' ').replace(/\s+/g, ' ').trim();

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!; const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bewijs = (groen: boolean, detail: unknown, klasse: string | null = null) => db.rpc('bg_bewijs', { p_bron: BRON, p_groen: groen, p_detail: detail, p_foutklasse: klasse }).then(() => {}, () => {});
  const geheim = async (n: string) => (((await db.rpc('bg_geheim', { p_naam: n })).data as string) || '').trim();
  const fail = async (s: number, b: Record<string, unknown>, k: string) => { await bewijs(false, b, k); return json({ ok: false, ...b }, s); };

  const { data: gov } = await db.from('brain_ai_governance_registry').select('model_id,lifecycle_status,approved,provider').eq('tenant_id', 'canonical').eq('use_case_id', USE_CASE).maybeSingle();
  if (!gov || gov.lifecycle_status !== 'ACTIVE' || gov.approved !== true || gov.provider !== 'Anthropic') return fail(403, { error: 'AI_USE_CASE_NOT_APPROVED' }, 'POLICY');
  const tavily = await geheim('TAVILY_API_KEY'); const ak = await geheim('ANTHROPIC_API_KEY');
  if (!tavily || !ak) return fail(503, { error: 'CONFIG_UNAVAILABLE', missing: { tavily: !tavily, anthropic: !ak } }, 'AUTH');
  let body: any = {}; try { body = await req.json(); } catch { /* leeg */ }

  try {
    let bedrijven: any[] = [];
    if (Array.isArray(body?.alleen) && body.alleen.length) {
      const { data } = await db.rpc('bg_bedrijven_voor_nieuws', { p_limiet: 20000 });
      const wens = body.alleen.map((x: string) => x.toLowerCase());
      bedrijven = (data || []).filter((b: any) => wens.some((w: string) => String(b.bedrijf).toLowerCase().startsWith(w)));
    } else {
      const { data, error } = await db.rpc('bg_bedrijven_voor_nieuws', { p_limiet: Math.min(Number(body?.bedrijven) || MAX_BEDRIJVEN, 20) });
      if (error) throw new Error('BEDRIJVEN: ' + error.message);
      bedrijven = data || [];
    }
    const grens = Date.now() - DAGEN * 86400000;
    const gevonden: any[] = []; let teOud = 0;
    for (const b of bedrijven) {
      const naam = schoon(b.bedrijf); const k = kern(naam);
      if (k.length < 3) { await db.from('bg_bedrijf_gecheckt').upsert({ bedrijf: b.bedrijf, laatst_gecheckt: new Date().toISOString(), resultaten: 0 }, { onConflict: 'bedrijf' }); continue; }
      const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { authorization: `Bearer ${tavily}`, 'content-type': 'application/json' }, body: JSON.stringify({ query: `"${naam}"`, topic: 'news', days: DAGEN, max_results: 5, search_depth: 'basic' }) });
      const res: any = await r.json().catch(() => ({}));
      const hits = (res.results || []).filter((x: any) => {
        if (SOCIAAL.test(domeinVan(x.url)) || !kern(`${x.title} ${x.content}`).includes(k)) return false;
        const t = Date.parse(x.published_date || ''); if (!Number.isFinite(t) || t < grens) { teOud++; return false; } return true;
      }).slice(0, 2);
      await db.from('bg_bedrijf_gecheckt').upsert({ bedrijf: b.bedrijf, laatst_gecheckt: new Date().toISOString(), resultaten: hits.length }, { onConflict: 'bedrijf' });
      for (const h of hits) gevonden.push({ bedrijf: naam, contact: b, url: h.url, titel: String(h.title || '').slice(0, 300), inhoud: String(h.content || '').slice(0, 900), domein: domeinVan(h.url), gepubliceerd_op: h.published_date || null });
    }
    if (!gevonden.length) { const r = { ok: true, bedrijven: bedrijven.length, nieuws: 0, te_oud: teOud, dms: 0 }; await bewijs(true, r); return json(r); }

    const schema = { type: 'object', properties: { oordelen: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, over_dit_bedrijf: { type: 'boolean', description: 'Waar alleen als het bericht aantoonbaar over precies dit bedrijf gaat, niet over een naamgenoot' }, soort: { type: 'string', enum: ['groei', 'overname of fusie', 'nieuwe vestiging', 'nieuwe dienst of product', 'personeel of vacatures', 'directiewisseling', 'prijs of erkenning', 'samenwerking', 'overig', 'persoonlijk'] }, haak: { type: 'string', description: 'Eén zin met het feit uit het bericht' }, zekerheid: { type: 'number' }, dm: { type: 'string', description: 'LinkedIn-DM van 35-65 woorden. Begint letterlijk met "Hoi {voornaam}," (de placeholder {voornaam} laten staan). Felicitatie of reactie op het nieuws met het concrete feit, dan één open vraag over hoe ze kennis en processen meenemen in die verandering. Geen link, geen verkooppraat, geen verzonnen ervaringen. Leeg als soort persoonlijk of overig is.' } }, required: ['url', 'over_dit_bedrijf', 'soort', 'haak', 'zekerheid', 'dm'] } } }, required: ['oordelen'] };
    const ai = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': ak, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: gov.model_id, max_tokens: 3500, system: 'Je beoordeelt zakelijk nieuws over bedrijven voor Arthur Prinsen (Bedrijfsgeheugen: kennisborging, processen en AI voor het Nederlandse mkb). Wees streng op naamgenoten: bij twijfel over_dit_bedrijf = false en zekerheid laag. Nieuws over het privéleven van personen: soort persoonlijk, geen DM. Gebruik alleen feiten uit het bericht. Schrijf de DM in het Nederlands.', messages: [{ role: 'user', content: JSON.stringify(gevonden.map(g => ({ url: g.url, bedrijf: g.bedrijf, titel: g.titel, bron: g.domein, datum: g.gepubliceerd_op, inhoud: g.inhoud }))) }], tools: [{ name: 'oordeel', description: 'oordeel', input_schema: schema }], tool_choice: { type: 'tool', name: 'oordeel' } }) });
    const aiBody: any = await ai.json().catch(() => ({}));
    if (!ai.ok) return fail(502, { error: `AI_${ai.status}` }, ai.status === 401 ? 'AUTH' : 'REMOTE');
    const oordelen: any[] = (aiBody.content || []).find((c: any) => c.type === 'tool_use')?.input?.oordelen || [];

    let dms = 0; const klaar: string[] = []; const perBedrijf = new Set<string>();
    for (const g of gevonden) {
      const o = oordelen.find(x => x.url === g.url);
      const dmTekst = String(o?.dm || '');
      const reden = !o ? 'geen oordeel' : !o.over_dit_bedrijf ? 'naamgenoot of niet over dit bedrijf' : o.zekerheid < MIN_ZEKERHEID ? `zekerheid ${o.zekerheid} < ${MIN_ZEKERHEID}` : ['persoonlijk', 'overig'].includes(o.soort) ? `soort ${o.soort}` : !dmTekst ? 'geen DM' : !dmTekst.includes('{voornaam}') ? 'DM zonder {voornaam}' : VERZONNEN.test(dmTekst) ? 'verzonnen ervaring in DM' : /https?:\/\//.test(dmTekst) ? 'link in DM' : perBedrijf.has(g.bedrijf) ? 'al een DM voor dit bedrijf' : dms >= MAX_DM ? 'dagmaximum bereikt' : null;
      let gebruikt: string | null = null; let fout: string | null = reden;
      if (!reden) {
        const c = g.contact; const voornaam = String(c.naam || '').trim().split(/\s+/)[0] || 'daar';
        const { error: ie } = await db.from('powerhouse_sales_actions').insert({ dedupe_key: `bedrijfsnieuws:${g.url}:${c.linkedin_url}`, subject_key: c.linkedin_url, person_name: c.naam, company_name: c.bedrijf, role: c.rol, action_type: 'inhaak_bedrijfsnieuws', channel: 'LinkedIn DM', priority: Number(c.score || 50) + 20, reason: `Nieuws over ${g.bedrijf}: ${String(g.titel).slice(0, 110)} (${g.domein})`, evidence: { nieuws_url: g.url, soort: o.soort, haak: o.haak, zekerheid: o.zekerheid }, message_draft: dmTekst.replaceAll('{voornaam}', voornaam), status: 'suggested', due_at: new Date().toISOString(), topic_key: 'bedrijfsnieuws' });
        if (!ie) { dms++; perBedrijf.add(g.bedrijf); gebruikt = 'dm'; klaar.push(`${c.naam} — ${g.bedrijf}: ${o.soort}`); await db.from('bg_connecties').update({ laatst_aangeboden_op: new Date().toISOString() }).eq('linkedin_url', c.linkedin_url); } else fout = 'opslaan: ' + ie.message.slice(0, 100);
      }
      await db.from('bg_bedrijfsnieuws').upsert({ url: g.url, bedrijf: g.bedrijf, titel: g.titel, domein: g.domein, gepubliceerd_op: g.gepubliceerd_op, over_dit_bedrijf: !!o?.over_dit_bedrijf, soort: o?.soort || null, haak: o?.haak || null, zekerheid: o?.zekerheid ?? null, dm: dmTekst || null, afgewezen_reden: fout, gebruikt_voor: gebruikt }, { onConflict: 'url' });
    }
    const r = { ok: true, bedrijven: bedrijven.length, nieuws: gevonden.length, te_oud: teOud, over_het_bedrijf: oordelen.filter(o => o.over_dit_bedrijf && o.zekerheid >= MIN_ZEKERHEID).length, dms, klaar };
    await bewijs(true, r);
    return json(r);
  } catch (e: any) {
    return fail(500, { error: String(e?.message || e).slice(0, 300) }, 'VALIDATION');
  }
});
