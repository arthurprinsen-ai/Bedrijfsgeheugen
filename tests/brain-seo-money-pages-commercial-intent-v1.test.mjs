import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Conversion is structural: a primary CTA anchor to /frisse-blik (wording is owned by the shared site shell).
const FRISSE_BLIK_CTA = /<a [^>]*href="\/frisse-blik"[^>]*>[^<]*Frisse blik/i;

test('commercial SEO intent stays on canonical money pages with Frisse blik conversion', async () => {
  const exact = await readFile('exact-online-koppeling.html', 'utf8');
  const api = await readFile('api-koppeling-laten-maken.html', 'utf8');
  const twinfield = await readFile('twinfield-koppeling.html', 'utf8');

  assert.match(exact, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/exact-online-koppeling">/);
  assert.match(exact, /Exact Online <span class="mark">API-koppeling<\/span> laten maken/);
  assert.match(exact, FRISSE_BLIK_CTA);

  assert.match(api, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/api-koppeling-laten-maken">/);
  assert.match(api, FRISSE_BLIK_CTA);

  assert.match(twinfield, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/twinfield-koppeling">/);
  assert.match(twinfield, /Twinfield-koppelingen/);
  assert.match(twinfield, FRISSE_BLIK_CTA);
});
