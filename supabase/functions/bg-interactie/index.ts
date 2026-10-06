// bg-interactie — eigen, privacyarme meting van alle interacties op site en portaal (11 sept 2026).
// Ontvangt een batch gebeurtenissen (sendBeacon, text/plain), valideert streng en schrijft naar public.bg_interacties.
// Niet opgeslagen: IP-adres, user-agent, cookies, querystrings, ingevulde formulierwaarden.
// v2: herkomst per sessie (utm-bron / -medium / -campagne of verwijzend domein), nooit persoonsgegevens.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ORIGINS = /^https:\/\/(?:www\.)?bedrijfsgeheugen\.nl$|^https:\/\/(?:deploy-preview-\d+--|main--)?bedrijfsgeheugen\.netlify\.app$/i;
const GEBEURTENISSEN = new Set(['pagina', 'klik', 'scroll', 'formulier_start', 'formulier_verzonden', 'tijd_op_pagina', 'zichtbaar']);
const ROBOT = /bot|crawl|spider|slurp|headless|lighthouse|playwright|puppeteer|phantom|preview|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|java\/|facebookexternalhit|embedly|quora|pinterest|vkshare|w3c_validator/i;
const PII = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+31|0031|\b0)[\s-]?[1-9](?:[\s-]?\d){7,8}\b/;
const MAX_BYTES = 32_000, MAX_EVENTS = 50;
const TELEMETRY_DB_TIMEOUT_MS = 2_500, TELEMETRY_BREAKER_MS = 30_000;
let degradedUntil = 0;

function degradedResponse(origin: string, reason: string) {
  return new Response(JSON.stringify({ ok: true, opgeslagen: 0, degraded: true, reason }), {
    status: 202,
    headers: { ...cors(origin), 'content-type': 'application/json', 'cache-control': 'no-store', 'x-bg-telemetry-degraded': '1' },
  });
}

const cors = (origin: string) => ({ 'access-control-allow-origin': ORIGINS.test(origin) ? origin : 'https://www.bedrijfsgeheugen.nl', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'origin', 'cache-control': 'no-store' });
const tekst = (v: unknown, max: number) => { const s = String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max); return s && !PII.test(s) ? s : null; };
const pad = (v: unknown) => { const s = String(v ?? '').split(/[?#]/)[0].trim(); return /^\/[^\s]{0,299}$/.test(s) ? s : null; };
const getal = (v: unknown, min: number, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
function doel(v: unknown) {
  const s = String(v ?? '').trim(); if (!s) return null;
  if (/^mailto:/i.test(s)) return 'mailto'; if (/^tel:/i.test(s)) return 'tel';
  try { const u = new URL(s, 'https://www.bedrijfsgeheugen.nl'); if (/(^|\.)bedrijfsgeheugen\.nl$/i.test(u.hostname)) return u.pathname.slice(0, 300); return 'extern:' + u.hostname.slice(0, 120); } catch { return null; }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return new Response('POST_ONLY', { status: 405, headers: cors(origin) });
  if (origin && !ORIGINS.test(origin)) return new Response('ORIGIN', { status: 403, headers: cors(origin) });
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return new Response('TOO_LARGE', { status: 413, headers: cors(origin) });
  let body: any; try { body = JSON.parse(raw); } catch { return new Response('JSON', { status: 400, headers: cors(origin) }); }
  const ua = req.headers.get('user-agent') || '';
  const robot = !ua || ROBOT.test(ua);
  const apparaat = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobiel' : 'desktop';
  const sessie = tekst(body?.sessie, 64);
  const toestemming = typeof body?.toestemming === 'boolean' ? body.toestemming : null;
  const bron = tekst(body?.bron_domein, 120);
  const herkomst = tekst(body?.herkomst, 160);
  const gebied = body?.gebied === 'portaal' ? 'portaal' : 'site';
  const rijen = (Array.isArray(body?.events) ? body.events : [body]).slice(0, MAX_EVENTS).map((e: any) => {
    const g = String(e?.gebeurtenis || ''); const p = pad(e?.pad);
    if (!GEBEURTENISSEN.has(g) || !p) return null;
    const t = Date.parse(e?.gebeurd_op || ''); const nu = Date.now();
    return { gebeurd_op: Number.isFinite(t) && Math.abs(nu - t) < 86_400_000 ? new Date(t).toISOString() : null, gebeurtenis: g, pad: p, gebied, element_tekst: tekst(e?.element_tekst, 120), element_soort: tekst(e?.element_soort, 30), element_doel: doel(e?.element_doel), onderdeel: tekst(e?.onderdeel, 80), diepte_pct: getal(e?.diepte_pct, 0, 100), seconden: getal(e?.seconden, 0, 86400), sessie, apparaat, bron_domein: bron, herkomst, toestemming, is_robot: robot };
  }).filter(Boolean);
  if (!rijen.length) return new Response(JSON.stringify({ ok: true, opgeslagen: 0 }), { status: 200, headers: { ...cors(origin), 'content-type': 'application/json' } });
  if (Date.now() < degradedUntil) return degradedResponse(origin, 'DATA_API_CIRCUIT_OPEN');

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, signal: AbortSignal.timeout(TELEMETRY_DB_TIMEOUT_MS) }) },
  });

  try {
    const { error } = await db.from('bg_interacties').insert(rijen);
    if (error) throw error;
    degradedUntil = 0;
    return new Response(JSON.stringify({ ok: true, opgeslagen: rijen.length }), { status: 200, headers: { ...cors(origin), 'content-type': 'application/json' } });
  } catch (error) {
    degradedUntil = Date.now() + TELEMETRY_BREAKER_MS;
    console.error('BG_INTERACTIE_DATA_API_DEGRADED', error instanceof Error ? error.message : String(error));
    return degradedResponse(origin, 'DATA_API_UNAVAILABLE');
  }
});
