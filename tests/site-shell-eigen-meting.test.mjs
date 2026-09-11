import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { metAnalytics, METING_SRC } from '../tools/site-shell/analytics-sitebreed.mjs';

// Eigen, privacyarme meting op elke publieke pagina (11 sept 2026, besluit Arthur: alles meten).
const kaal = '<!doctype html><html><head><title>x</title></head><body><main><a class="cta" href="/zelfscan">Doe de scan</a></main></body></html>';
const meting = readFileSync('assets/meting.js', 'utf8');

test('elke publieke pagina krijgt het meetscript, precies één keer', () => {
  const uit = metAnalytics(kaal);
  assert.equal((uit.match(/data-bg-meting/g) || []).length, 1);
  assert.ok(uit.includes(`src="${METING_SRC}" defer`));
  assert.equal(metAnalytics(uit), uit, 'idempotent');
});

test('het meetscript meet kliks, scrolldiepte, formulieren en tijd naar de eigen ontvanger', () => {
  assert.match(meting, /functions\/v1\/bg-interactie/);
  for (const g of ["gebeurtenis:'pagina'", "gebeurtenis:'klik'", "gebeurtenis:'scroll'", "gebeurtenis:'formulier_start'", "gebeurtenis:'formulier_verzonden'", "gebeurtenis:'tijd_op_pagina'"]) assert.ok(meting.includes(g), g);
  assert.match(meting, /drempels=\[25,50,75,90,100\]/);
});

test('privacyarm: geen cookies, geen ingevulde waarden, GA4 alleen na toestemming', () => {
  assert.doesNotMatch(meting, /document\.cookie/);
  assert.doesNotMatch(meting, /\.value\s*[,}]|FormData|elements\[/, 'nooit ingevulde waarden uitlezen');
  assert.match(meting, /function ga\(naam,p\)\{try\{if\(toestemming\(\)&&typeof window\.gtag==='function'\)/, 'GA4-events alleen na toestemming');
  assert.match(meting, /if\(window\.__bgMeting\)return;/, 'één keer per pagina');
});

test('bezwaar via Do Not Track of Global Privacy Control stopt de meting', () => {
  assert.match(meting, /navigator\.globalPrivacyControl===true/);
  assert.match(meting, /navigator\.doNotTrack==='1'/);
  assert.ok(meting.indexOf('globalPrivacyControl') < meting.indexOf("gebeurtenis:'pagina'"), 'de controle staat vóór de eerste meting');
});

test('de privacyverklaring beschrijft de eigen meting zoals die werkt', () => {
  const p = readFileSync('privacy.html', 'utf8');
  for (const tekst of ['Eigen sitemeting zonder cookies', 'Supabase', '13 maanden', 'Global Privacy Control', 'nooit wat je in een formulier invult']) assert.ok(p.includes(tekst), tekst);
});

test('herkomst per sessie en koppeling met Calendly, zonder persoonsgegevens', () => {
  assert.match(meting, /bg_meting_herkomst/);
  assert.match(meting, /herkomst:herkomst/, 'herkomst gaat mee naar de ontvanger');
  assert.match(meting, /calendly\\.com/);
  assert.match(meting, /utm_content',sid\)/, 'de tabbladcode gaat als utm_content mee');
  assert.ok(readFileSync('privacy.html', 'utf8').includes('geven we die tabbladcode en de pagina mee aan Calendly'), 'privacyverklaring noemt de Calendly-koppeling');
});
