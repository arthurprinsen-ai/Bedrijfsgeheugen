import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('SEO money-page source strings are covered by the versioned English overlay',async()=>{
  const overlay=JSON.parse(await readFile('data/i18n/bg-static-i18n-en-seo-20260925.json','utf8'));
  const pages=await Promise.all([
    readFile('exact-online-koppeling.html','utf8'),
    readFile('api-koppeling-laten-maken.html','utf8'),
    readFile('twinfield-koppeling.html','utf8')
  ]);
  const required=[
    'Exact Online API-koppeling laten maken | Bedrijfsgeheugen',
    'Start met een Frisse blik',
    'Bespreek de koppeling',
    'Exact Online API-koppeling laten maken voor webshop, CRM of urenregistratie. Vaste prijs, meestal binnen twee weken werkend, op het pakket dat je al hebt.',
    'Twinfield doet de boekhouding goed. Het probleem zit meestal ervoor: de gegevens moeten er met de hand in. Wij bouwen Twinfield-koppelingen die dat overnemen, tegen een vaste prijs.'
  ];
  const combined=pages.join('\n');
  for(const source of required){
    assert.ok(combined.includes(source),source);
    assert.equal(typeof overlay[source],'string',source);
    assert.ok(overlay[source].trim().length>0,source);
  }
});

test('localized-route builder merges the versioned overlay before validation',async()=>{
  const source=await readFile('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/TRANSLATION_CACHE_OVERLAYS/);
  assert.ok(source.includes("bg-static-i18n-en-seo-20260925.json"));
  assert.ok(source.includes("cache={...cache,...json}"));
});
