import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prerenderMoney} from '../tools/site-shell/money-prerender.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const canonical='https://www.bedrijfsgeheugen.nl/twinfield-koppeling';
const text=html=>String(html).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const h1=html=>[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>text(m[1]));

test('original Twinfield canonical money source has ONE buyer-intent aligned H1 and unchanged conversion',async()=>{
 const html=await read('twinfield-koppeling.html');
 const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]||'';
 const headings=h1(html);
 assert.equal(headings.length,1,'one clear page H1');
 assert.equal(headings[0],'Twinfield API-koppeling laten maken.');
 assert.match(title,/Twinfield API-koppeling laten maken/);
 assert.match(html,/<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/twinfield-koppeling">/);
 assert.match(html,/<a class="knop" data-money-primary href="\/frisse-blik">/);
 assert.match(html,/Twinfield-koppelingen die dat overnemen/);
 assert.doesNotMatch(headings[0],/aan de rest van je bedrijf/);
 const registry=JSON.parse(await read('site/seo-order-map.json'));
 const owners=registry.pages.filter(p=>p.route===canonical);
 assert.equal(owners.length,1,'no new duplicate canonical keyword owner');
 assert.equal(owners[0].primary_keyword,'twinfield koppeling');
 assert.equal(owners[0].primary_cta.url,'https://www.bedrijfsgeheugen.nl/frisse-blik');
});

test('original final money-page prerender preserves aligned visible H1',async()=>{
 const html=await read('twinfield-koppeling.html');
 const style=await read('assets/stijl.js');
 const built=prerenderMoney(html,'/twinfield-koppeling',style);
 assert.deepEqual(h1(built),['Twinfield API-koppeling laten maken.']);
 assert.match(built,/<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/twinfield-koppeling">/);
 assert.match(built,/href="\/frisse-blik"/);
 const en=JSON.parse(await read('config/bg-static-i18n-en.d/2026-11-17-seo-twinfield-intent-h1-v1.json'));
 assert.equal(en['Twinfield API-koppeling laten maken.'],'Have a Twinfield API integration built.');
});

test('one original SEO owner receives exact existing recommendation and no fabricated growth conclusion',async()=>{
 const learning=JSON.parse(await read('brain/learning/2026-11-17-seo-twinfield-intent-h1-v1.json'));
 const skill=await read('.agents/skills/seo-revenue-growth/SKILL.md');
 assert.equal(learning.obligation_id,'seo-owner-update:2026-11-17:twinfield-koppeling');
 assert.equal(learning.evidence.organic_visitor_growth_proven,false);
 assert.equal(learning.evidence.ga4_gsc_current_source_status,'MISSING_OR_AWAITING_PROVIDER');
 assert.match(skill,/seo\|twinfield-buyer-intent-h1-gap\|20261117-v1/);
 assert.match(skill,/Geen nieuwe keyword-owner/);
});
