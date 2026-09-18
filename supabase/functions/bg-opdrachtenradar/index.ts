// Opdrachtenradar — nachtelijke producer, v1, 18 september 2026
// Zoekt freelance-/interimopdrachten in data, AI en BI in Nederland via Tavily,
// laat nieuwe treffers beoordelen door Claude en schrijft relevante opdrachten naar public.bg_opdrachten.
// Sleutels uitsluitend via Vault (public.bg_geheim): TAVILY_API_KEY, ANTHROPIC_API_KEY, powerhouse_daily_scheduler_token;
// optioneel ADZUNA_APP_ID, ADZUNA_APP_KEY en JOOBLE_API_KEY voor vacature-API's.
// Bewijs: powerhouse_record_source_observation_v1 (bron 'opdrachtenradar') en public.bg_gezondheid.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT = 'bg-opdrachtenradar-v1';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_KANDIDATEN = 200;
const DOMEINEN_PER_GROEP = 7;
const BATCH = 10;

const ROLGROEPEN = [
  ['data engineer', 'analytics engineer', 'Microsoft Fabric', 'Azure data'],
  ['BI consultant', 'Power BI', 'business intelligence', 'data analist'],
  ['AI consultant', 'data architect', 'data governance', 'machine learning'],
  ['interim manager data', 'data product owner', 'datagedreven transformatie', 'Chief Data Officer interim'],
];
const BRONNEN: { naam: string; domains: string[] }[] = [
  { naam: 'Freelanceplatforms', domains: ['freelance.nl', 'hoofdkraan.nl', 'freep.nl', 'zzp-opdrachten.nl', 'freelancer.nl', 'consultant.nl', 'werkzoeken.nl', 'interimnetwerk.nl', 'planetinterim.nl'] },
  { naam: 'Brokers en bureaus', domains: ['striive.com', 'circle8.nl', 'headfirst.nl', 'between.nl', 'yacht.nl', 'harveynash.nl', 'ictergezocht.nl', 'myler.nl', 'magnitglobal.com', 'ctm.nl'] },
  { naam: 'Overheid en inhuurdesks', domains: ['flextender.nl', 'tenderned.nl', 'mercell.com', 'werkenvoornederland.nl', 'negometrix.com', 'inhuurdesk.nl', 'opdrachtoverheid.nl', 's2m.nl'] },
  { naam: 'Vacaturesites', domains: ['linkedin.com', 'nl.indeed.com', 'nationalevacaturebank.nl', 'jobbird.com', 'werk.nl'] },
  { naam: 'Open web', domains: [] },
];

// Profiel-, categorie- en overzichtspagina's zijn nooit een losse opdracht; die gaan niet naar de beoordeling.
const RUIS = [
  /linkedin\.com\/(in|company|school)\//i,
  /\/(search_tag|vakgebieden|functies|kennisbank|blog|category|categories|beroepengids|salaris|uurtarieven)(\/|$)/i,
  /indeed\.com\/q-/i,
  /glassdoor\.[a-z]+\/Vacature\/.*SRCH_/i,
];
const isRuis = (u: string) => {
  try { const x = new URL(u); if (x.pathname === '/' || /^\/(vacatures|opdrachten|jobs)\/?$/i.test(x.pathname)) return true; } catch { return true; }
  return RUIS.some(r => r.test(u));
};
// Vacature-API's voor bronnen die zoekmachines afschermen (Indeed-achtig). Alleen actief als de sleutels in Vault staan.
const API_TERMEN = ['freelance data engineer', 'freelance BI consultant', 'zzp Power BI', 'interim data analist', 'freelance data architect', 'freelance AI consultant'];

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clean = (v: unknown) => String(v ?? '').trim();
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const normUrl = (u: string) => {
  try {
    const x = new URL(u); x.hash = '';
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref']) x.searchParams.delete(k);
    return x.toString().replace(/\/$/, '');
  } catch { return u; }
};
// Zelfde hash als de Opdrachtenradar-app (djb2, base36), zodat app en producer dezelfde sleutel gebruiken.
const hashUrl = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'o' + h.toString(36); };
const datum = (v: unknown) => { const s = clean(v); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };

type Kandidaat = { id: string; url: string; titel: string; tekst: string; bron: string };

async function inGroepen<T, R>(items: T[], grootte: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const uit: R[] = [];
  for (let i = 0; i < items.length; i += grootte) uit.push(...await Promise.all(items.slice(i, i + grootte).map(fn)));
  return uit;
}

function prompt(deel: Kandidaat[], cv: string) {
  const vandaag = new Date().toISOString().slice(0, 10);
  return `Je beoordeelt zoekresultaten voor een Nederlandse freelance consultant in data, AI en BI. Vandaag is ${vandaag}.

Een resultaat is RELEVANT alleen als het één concrete, nog openstaande opdracht of vacature is (geen overzichtspagina, categoriepagina, blog, trainingsaanbod of cursus), in Nederland of remote voor een Nederlandse opdrachtgever, én geschikt voor een zzp'er/freelancer/interim (een vaste loondienstbaan is NIET relevant), én inhoudelijk over data, BI, analytics, data engineering, data architectuur, AI/ML, data governance of een datagedreven transformatie.

Cv van de consultant:
"""${cv || '(geen cv opgegeven — geef match null)'}"""

Resultaten:
${deel.map((d, i) => `[${i}] ${d.titel}\nURL: ${d.url}\n${d.tekst}`).join('\n\n')}

Antwoord met alleen een JSON-array, één object per resultaat:
[{"i":0,"relevant":true,"titel":"korte functietitel","organisatie":"","bemiddelaar":"","locatie":"","werkvorm":"op locatie|hybride|remote|onbekend","uren":"","tarief":"","start":"","duur":"","sluitdatum":"YYYY-MM-DD of leeg","samenvatting":"twee zinnen","match":75,"waarom":"één zin"}]
match is een geheel getal van 0 tot 100: 100 = past volledig bij het cv, 50 = deels, 0 = past niet. Gebruik null als er geen cv is.
Voor niet-relevante resultaten volstaat {"i":n,"relevant":false}. Verzin geen gegevens: laat onbekende velden leeg.`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '', service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json({ ok: false, error: 'CONFIG' }, 500);
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const geheim = async (n: string) => clean((await db.rpc('bg_geheim', { p_naam: n })).data);

  const verwacht = await geheim('powerhouse_daily_scheduler_token');
  if (!verwacht || req.headers.get('x-powerhouse-token') !== verwacht) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);

  const nu = new Date().toISOString();
  const gezondheid = (status: string, detail: string, gegevens: unknown) =>
    db.from('bg_gezondheid').insert({ gemeten_op: nu, onderdeel: 'opdrachtenradar', soort: 'external-opportunity-intelligence', status, detail, gegevens }).then(() => {}, () => {});

  try {
    const [tavily, anthropic] = await Promise.all([geheim('TAVILY_API_KEY'), geheim('ANTHROPIC_API_KEY')]);
    if (!tavily || !anthropic) throw new Error(`CONFIG_UNAVAILABLE:${!tavily ? 'TAVILY_API_KEY ' : ''}${!anthropic ? 'ANTHROPIC_API_KEY' : ''}`.trim());

    const { data: profiel } = await db.from('bg_opdrachten_profiel').select('cv,extra_domeinen').eq('id', 'arthur').maybeSingle();
    const cv = clean(profiel?.cv).slice(0, 3500);
    const extra = (profiel?.extra_domeinen || []) as string[];

    // 1. Zoekvragen
    const extraGroepen: { naam: string; domains: string[] }[] = [];
    for (let i = 0; i < extra.length; i += DOMEINEN_PER_GROEP) extraGroepen.push({ naam: `Eigen domeinen ${i / DOMEINEN_PER_GROEP + 1}`, domains: extra.slice(i, i + DOMEINEN_PER_GROEP) });
    const groepen = [...BRONNEN, ...extraGroepen];
    const vragen = groepen.flatMap(b => ROLGROEPEN.map(rollen => {
      const term = rollen.map(r => `"${r}"`).join(' OR ');
      const prefix = b.domains.length ? 'freelance interim opdracht' : 'freelance OR interim OR zzp OR inhuur opdracht Nederland';
      const body: Record<string, unknown> = { query: `${prefix} (${term})`, max_results: 20, time_range: 'week', search_depth: 'basic', country: 'netherlands', include_answer: false };
      if (b.domains.length) body.include_domains = b.domains;
      return { bron: b.naam, body };
    }));

    // Recruiters plaatsen opdrachten vaak als gewone LinkedIn-post; die zijn wel vindbaar.
    vragen.push({ bron: 'LinkedIn-posts', body: { query: '#opdrachtbeschikbaar OR "opdracht beschikbaar" OR "freelance opdracht" (data OR BI OR "Power BI" OR AI)', max_results: 20, time_range: 'week', search_depth: 'basic', include_domains: ['linkedin.com'], include_answer: false } });

    const zoekFouten: string[] = [];
    const resultaten = await inGroepen(vragen, 5, async v => {
      const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { authorization: `Bearer ${tavily}`, 'content-type': 'application/json' }, body: JSON.stringify(v.body) });
      const b: any = await r.json().catch(() => ({}));
      if (!r.ok) { zoekFouten.push(`${v.bron}: ${r.status} ${clean(b?.detail?.error || b?.error).slice(0, 80)}`); return []; }
      return ((b.results || []) as any[]).map(x => ({ ...x, _bron: v.bron }));
    });
    const [adzunaId, adzunaKey, joobleKey] = await Promise.all([geheim('ADZUNA_APP_ID'), geheim('ADZUNA_APP_KEY'), geheim('JOOBLE_API_KEY')]);
    const apiResultaten = await inGroepen(API_TERMEN, 3, async term => {
      const uit: any[] = [];
      if (adzunaId && adzunaKey) {
        const q = new URLSearchParams({ app_id: adzunaId, app_key: adzunaKey, what: term, max_days_old: '7', results_per_page: '50', 'content-type': 'application/json' });
        const r = await fetch(`https://api.adzuna.com/v1/api/jobs/nl/search/1?${q}`).catch(() => null);
        const b: any = r ? await r.json().catch(() => ({})) : {};
        if (!r?.ok) zoekFouten.push(`Adzuna: ${r?.status ?? 'netwerk'}`);
        else uit.push(...((b.results || []) as any[]).map(x => ({ url: x.redirect_url, title: x.title, content: clean(x.description), _bron: 'Adzuna API' })));
      }
      if (joobleKey) {
        const r = await fetch(`https://nl.jooble.org/api/${joobleKey}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: term, page: '1' }) }).catch(() => null);
        const b: any = r ? await r.json().catch(() => ({})) : {};
        if (!r?.ok) zoekFouten.push(`Jooble: ${r?.status ?? 'netwerk'}`);
        else uit.push(...((b.jobs || []) as any[]).map(x => ({ url: x.link, title: x.title, content: clean(x.snippet), _bron: 'Jooble API' })));
      }
      return uit;
    });
    const alle = [...resultaten.flat(), ...apiResultaten.flat()];
    if (!alle.length && zoekFouten.length) throw new Error('TAVILY: ' + zoekFouten.slice(0, 3).join(' | '));

    // 2. Nieuwe kandidaten
    const perId = new Map<string, Kandidaat>();
    let ruis = 0;
    for (const r of alle) {
      if (!r.url) continue;
      if (isRuis(r.url)) { ruis++; continue; }
      const u = normUrl(r.url), id = hashUrl(u);
      if (!perId.has(id)) perId.set(id, { id, url: u, titel: clean(r.title), tekst: clean(r.content).slice(0, 1400), bron: r._bron });
    }
    const ids = [...perId.keys()];
    const bekend = new Set<string>();
    for (let i = 0; i < ids.length; i += 200) {
      const deel = ids.slice(i, i + 200);
      const [a, b] = await Promise.all([
        db.from('bg_opdrachten').select('url_hash').in('url_hash', deel),
        db.from('bg_opdrachten_genegeerd').select('url_hash').in('url_hash', deel),
      ]);
      for (const x of [...(a.data || []), ...(b.data || [])]) bekend.add(x.url_hash);
    }
    if (bekend.size) {
      const gezien = ids.filter(id => bekend.has(id));
      for (let i = 0; i < gezien.length; i += 200) await db.from('bg_opdrachten').update({ laatst_gezien_op: nu }).in('url_hash', gezien.slice(i, i + 200));
    }
    const nieuw = ids.filter(id => !bekend.has(id)).map(id => perId.get(id)!);
    const teBeoordelen = nieuw.slice(0, MAX_KANDIDATEN);

    // 3. Beoordelen
    const batches: Kandidaat[][] = [];
    for (let i = 0; i < teBeoordelen.length; i += BATCH) batches.push(teBeoordelen.slice(i, i + BATCH));
    const beoordeelFouten: string[] = [];
    let relevant = 0, genegeerd = 0;
    await inGroepen(batches, 4, async deel => {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': anthropic, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt(deel, cv) }] }),
      });
      const b: any = await r.json().catch(() => ({}));
      if (!r.ok) { beoordeelFouten.push(`${r.status} ${clean(b?.error?.message).slice(0, 80)}`); return; }
      const tekst = ((b.content || []) as any[]).filter(c => c.type === 'text').map(c => c.text).join('');
      const s = tekst.indexOf('['), e = tekst.lastIndexOf(']');
      let uit: any[] = [];
      try { uit = JSON.parse(tekst.slice(s, e + 1)); } catch { beoordeelFouten.push('INVALID_JSON'); return; }
      const rijen: Record<string, unknown>[] = [], weg: Record<string, unknown>[] = [];
      for (const o of uit) {
        const k = deel[Number(o?.i)]; if (!k) continue;
        if (!o.relevant) { weg.push({ url_hash: k.id, url: k.url, gezien_op: nu }); continue; }
        const m = Number(o.match);
        rijen.push({
          url_hash: k.id, url: k.url, bron: k.bron, site: host(k.url), snippet: k.tekst,
          titel: clean(o.titel) || k.titel || 'Opdracht', organisatie: clean(o.organisatie), bemiddelaar: clean(o.bemiddelaar),
          locatie: clean(o.locatie), werkvorm: clean(o.werkvorm), uren: clean(o.uren), tarief: clean(o.tarief),
          start: clean(o.start), duur: clean(o.duur), sluitdatum: datum(o.sluitdatum), samenvatting: clean(o.samenvatting),
          match: cv && Number.isFinite(m) ? Math.max(0, Math.min(100, Math.round(m))) : null, waarom: clean(o.waarom),
          gevonden_op: nu, laatst_gezien_op: nu, beoordeeld_door: MODEL,
        });
      }
      if (rijen.length) { const { error } = await db.from('bg_opdrachten').upsert(rijen, { onConflict: 'url_hash', ignoreDuplicates: true }); if (error) throw new Error('STORE: ' + error.message); relevant += rijen.length; }
      if (weg.length) { const { error } = await db.from('bg_opdrachten_genegeerd').upsert(weg, { onConflict: 'url_hash', ignoreDuplicates: true }); if (error) throw new Error('STORE_IGNORED: ' + error.message); genegeerd += weg.length; }
    });

    const samenvatting = {
      contract: CONTRACT, zoekvragen: vragen.length, api_bronnen: [adzunaId && adzunaKey ? 'adzuna' : null, joobleKey ? 'jooble' : null].filter(Boolean), treffers: alle.length, ruis, uniek: ids.length, nieuw: nieuw.length,
      beoordeeld: teBeoordelen.length, uitgesteld: nieuw.length - teBeoordelen.length, relevant, genegeerd,
      zoek_fouten: zoekFouten, beoordeel_fouten: beoordeelFouten, cv_aanwezig: !!cv,
    };
    const { error: hbError } = await db.rpc('powerhouse_record_source_observation_v1', {
      p_source_key: 'opdrachtenradar',
      p_dedupe_key: `opdrachtenradar-producer-run:${nu.slice(0, 13)}`,
      p_external_event_id: `producer-run:${nu}`,
      p_observed_at: nu,
      p_evidence: { ...samenvatting, authority: 'bg_opdrachten', producer_run: true },
    });
    if (hbError) throw new Error('PRODUCER_HEARTBEAT: ' + hbError.message);
    const ok = !beoordeelFouten.length && zoekFouten.length < vragen.length / 2;
    await gezondheid(ok ? 'ok' : 'waarschuwing', `treffers=${alle.length}; nieuw=${nieuw.length}; relevant=${relevant}; genegeerd=${genegeerd}; fouten=${zoekFouten.length + beoordeelFouten.length}`, samenvatting);
    return json({ ok, ...samenvatting });
  } catch (e: any) {
    const detail = clean(e?.message || e).slice(0, 500);
    await gezondheid('fout', detail, { contract: CONTRACT });
    return json({ ok: false, contract: CONTRACT, error: detail }, 503);
  }
});
