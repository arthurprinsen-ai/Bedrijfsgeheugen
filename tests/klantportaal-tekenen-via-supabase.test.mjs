import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/**
 * Tekenen in het klantportaal gaat naar de database, niet naar Make.
 *
 * Tot 11 september 2026 stuurde de handtekening onder een offerte het akkoord
 * naar de Make-webhook van BG 28 en naar localStorage. In offertes stond het
 * nergens. Nu roept het portaal public.offerte_akkoord aan zodra de klant via
 * Supabase is ingelogd. Die functie legt het akkoord vast en zet een melding
 * klaar in Vandaag. Zonder Supabase-sessie (de demo) blijft de oude route.
 *
 * Deze test draait de echte helper uit klantportaal.html met een nagebootste
 * fetch, zodat de volgorde van de aanroepen vastligt.
 */

const html = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');
const blok = html.match(/\/\* BG_TEKEN_START[\s\S]*?\/\* BG_TEKEN_EINDE \*\//);

function draai({ token = 'tok-1', auth = null, antwoorden }) {
  assert.ok(blok, 'de tekenhelper staat in klantportaal.html');
  const aanroepen = [];
  const sessie = new Map(token ? [['bg_token', token]] : []);
  const lokaal = new Map(auth ? [['bg_customer_auth', JSON.stringify(auth)]] : []);
  const opslag = m => ({ getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) });
  const fetch = async (url, opties = {}) => {
    const pad = url.replace('https://adhjwmvyoixzjtmiroln.supabase.co', '');
    aanroepen.push({ pad, auth: opties.headers?.Authorization, body: opties.body ? JSON.parse(opties.body) : null });
    const [status, body] = antwoorden(pad, opties, aanroepen.length);
    const tekst = JSON.stringify(body);
    return { ok: status < 300, status, text: async () => tekst, json: async () => body };
  };
  const ctx = { window: {}, sessionStorage: opslag(sessie), localStorage: opslag(lokaal), fetch, JSON, String, Promise, encodeURIComponent };
  vm.runInNewContext(blok[0], ctx);
  return { teken: ctx.window.__BG_TEKEN__, aanroepen, sessie };
}

const normaal = pad => {
  if (pad.startsWith('/rest/v1/organisaties')) return [200, [{ id: 'org-1' }]];
  if (pad.startsWith('/rest/v1/offertes')) return [200, [{ id: 'off-1' }]];
  if (pad === '/rest/v1/rpc/offerte_akkoord') return [200, [{ offerte: 'off-1', stand: 'geaccepteerd' }]];
  return [500, {}];
};

test('met een Supabase-sessie gaat het akkoord naar offerte_akkoord', async () => {
  const { teken, aanroepen } = draai({ antwoorden: normaal });
  const uitslag = await teken('ijsselmonde', { naam: 'Tom Brusselaars', functie: 'Directeur' });
  assert.equal(uitslag[0].stand, 'geaccepteerd');
  assert.deepEqual(aanroepen.map(a => a.pad.split('?')[0]),
    ['/rest/v1/organisaties', '/rest/v1/offertes', '/rest/v1/rpc/offerte_akkoord']);
  assert.match(aanroepen[0].pad, /slug=eq\.ijsselmonde/);
  assert.deepEqual(aanroepen[2].body, { p_offerte: 'off-1', p_naam: 'Tom Brusselaars', p_functie: 'Directeur' });
  assert.ok(aanroepen.every(a => a.auth === 'Bearer tok-1'));
});

test('zonder Supabase-sessie geeft de helper null en blijft de oude route', () => {
  const { teken, aanroepen } = draai({ token: null, antwoorden: normaal });
  assert.equal(teken('demo1', { naam: 'Test Persoon' }), null);
  assert.equal(aanroepen.length, 0);
});

test('een verlopen sessie wordt eenmaal vernieuwd en daarna getekend', async () => {
  const { teken, aanroepen, sessie } = draai({
    auth: { access_token: 'tok-1', refresh_token: 'ref-1' },
    antwoorden: (pad, opties) => {
      if (pad.startsWith('/auth/v1/token?grant_type=refresh_token')) return [200, { access_token: 'tok-2', refresh_token: 'ref-2' }];
      if (opties.headers?.Authorization === 'Bearer tok-1') return [401, { message: 'JWT expired' }];
      return normaal(pad);
    }
  });
  const uitslag = await teken('ijsselmonde', { naam: 'Tom Brusselaars' });
  assert.equal(uitslag[0].stand, 'geaccepteerd');
  assert.equal(sessie.get('bg_token'), 'tok-2');
  assert.equal(aanroepen.filter(a => a.pad.startsWith('/auth/v1/token')).length, 1);
  assert.equal(aanroepen.at(-1).auth, 'Bearer tok-2');
});

test('de melding van de server komt bij de klant terecht', async () => {
  const { teken } = draai({
    antwoorden: pad => pad === '/rest/v1/rpc/offerte_akkoord'
      ? [400, { message: 'Deze offerte is verlopen op 2026-09-17.' }] : normaal(pad)
  });
  await assert.rejects(teken('ijsselmonde', { naam: 'Tom Brusselaars' }),
    e => e.uitleg === 'Deze offerte is verlopen op 2026-09-17.');
});

test('een onbekende fout wordt niet letterlijk getoond', async () => {
  const { teken } = draai({ antwoorden: pad => pad.startsWith('/rest/v1/offertes') ? [500, { message: 'relation x does not exist' }] : normaal(pad) });
  await assert.rejects(teken('ijsselmonde', { naam: 'Tom Brusselaars' }),
    e => e.uitleg === 'Tekenen lukte niet. Mail arthur@bedrijfsgeheugen.nl.');
});

test('beide tekenknoppen gebruiken de helper vóór de webhook', () => {
  const aanroepen = html.match(/\(viaDb\s*\|\|\s*fetch\(HOOK/g) || [];
  assert.equal(aanroepen.length, 2);
  const plekken = [...html.matchAll(/soort:\s*'Akkoord offerte'/g)].map(m => m.index);
  assert.equal(plekken.length, 2);
  for (const plek of plekken) {
    assert.match(html.slice(plek - 400, plek), /\(viaDb\s*\|\|\s*fetch\(HOOK/, 'elk akkoord gaat eerst langs de helper');
  }
});

test('de pagina bevat geen service-role-sleutel', () => {
  assert.doesNotMatch(html, /service_role|sb_secret_/);
});
