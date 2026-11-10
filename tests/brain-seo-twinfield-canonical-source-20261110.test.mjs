import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async f=>readFile(new URL('../'+f,import.meta.url),'utf8');
test('Twinfield short commercial API intent belongs exclusively to existing canonical money page',async()=>{
 const seo=JSON.parse(await read('site/seo-order-map.json'));
 const locale=JSON.parse(await read('site/seo-locale-revenue-map.json'));
 const alias='twinfield api';
 const exact='https://www.bedrijfsgeheugen.nl/twinfield-koppeling';
 const matches=seo.pages.filter(p=>p.primary_keyword===alias||p.secondary_keywords?.includes(alias));
 assert.equal(matches.length,1);
 assert.equal(matches[0].route,exact);
 assert.equal(matches[0].role,'money');
 assert.equal(matches[0].primary_cta.url,'https://www.bedrijfsgeheugen.nl/frisse-blik');
 assert.ok(locale.pages.find(x=>x.source_route===exact).nl.secondary_keywords.includes(alias));
});
test('existing Twinfield page is one reversible, truthful and measured canonical, not a duplicate blog',async()=>{
 const html=await read('twinfield-koppeling.html');
 assert.match(html,/<title>Twinfield API-koppeling laten maken \| Bedrijfsgeheugen<\/title>/);
 assert.match(html,/<meta name="description" content="Twinfield API-koppeling voor je boekhouding, webshop, CRM of urenregistratie/);
 assert.match(html,/<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/twinfield-koppeling"/);
 assert.match(html,/href="\/frisse-blik"/);
 assert.doesNotMatch(html,/noindex/i);
});
test('new Twinfield copy remains reproducibly translatable without live network calls',async()=>{
 const map=JSON.parse(await read('config/bg-static-i18n-en.d/2026-11-10-twinfield-api-seo-source.json'));
 for(const source of [
  'Twinfield API-koppeling laten maken | Bedrijfsgeheugen',
  'Twinfield API-koppeling voor je boekhouding, webshop, CRM of urenregistratie. Ontdek welke gegevens je kunt automatiseren en hoe je fouten voorkomt.',
  'Vergelijking tussen de huidige situatie en de situatie met twinfield api-koppeling laten maken'
 ])assert.ok(typeof map[source]==='string'&&map[source].length>10);
});
