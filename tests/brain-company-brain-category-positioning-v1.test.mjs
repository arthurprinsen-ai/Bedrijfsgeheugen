import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Company Intelligence category page owns the intent and routes to existing revenue funnel',()=>{
  const html=fs.readFileSync('company-intelligence.html','utf8');
  assert.match(html,/canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/company-intelligence"/);
  assert.match(html,/Company Intelligence is waar Bedrijfsgeheugen begint\./);
  assert.match(html,/Weten → Zien → Begrijpen → Doen → Leren/);
  assert.match(html,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
  assert.doesNotMatch(html,/garandeer|gegarandeerd|beste Company Intelligence/i);
});

test('homepage post-build authority projects Company Intelligence positioning',()=>{
  const src=fs.readFileSync('tools/bouw-v18-ai-ecosysteem.mjs','utf8');
  assert.match(src,/Meer dan company intelligence\./);
  assert.match(src,/https:\/\/www\.bedrijfsgeheugen\.nl\/company-intelligence/);
  assert.match(src,/intelligentie- en uitvoeringslaag/);
  assert.match(src,/Je bedrijf weet meer dan het gebruikt/);
});

test('SEO and Brain authorities inherit category-to-revenue contract',()=>{
  const map=JSON.parse(fs.readFileSync('site/seo-order-map.json','utf8'));
  const owner=map.pages.find(p=>p.primary_keyword==='company intelligence');
  assert.equal(owner?.route,'https://www.bedrijfsgeheugen.nl/company-intelligence');
  assert.equal(owner?.primary_cta?.url,'https://www.bedrijfsgeheugen.nl/zelfscan');
  const growth=JSON.parse(fs.readFileSync('config/seo-growth-loop.json','utf8'));
  assert.equal(growth.optimization.category_capture.company_brain.product_rename_forbidden,true);
  assert.deepEqual(growth.optimization.category_capture.company_brain.terminal_outcomes,['paid_order','realized_revenue']);
  assert.match(fs.readFileSync('AGENTS.md','utf8'),/commercial-positioning\|company-brain-to-bedrijfsgeheugen\|orders-loop\|v1/);
  assert.match(fs.readFileSync('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md','utf8'),/seo\|company-brain\|category-capture-to-revenue\|v1/);
  assert.match(fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8'),/companyBrainCanonicalOwner:'\/company-intelligence'/);
});

test('accepted website baseline includes Company Intelligence route',()=>{
  const baseline=JSON.parse(fs.readFileSync('site/accepted-baseline.json','utf8'));
  assert.ok(baseline.routes.some(r=>r.route==='/company-intelligence' && r.file==='company-intelligence.html'));
});


test('delivery classifier recognizes the new public page',()=>{
  const delivery=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const website=delivery.lanes.find(lane=>lane.id==='website');
  assert.ok(website?.paths.includes('company-intelligence.html'));
});

test('static i18n patch covers final post-shell Company Intelligence strings',()=>{
  const patch=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/20260930-company-brain-category-v1.json','utf8'));
  const required=[
    'Vergelijking tussen de huidige situatie en de situatie met company intelligence voor het mkb',
    'Bekijk het platform',
    'De categorie Company Intelligence draait om één gedeelde context voor mensen en AI.',
    'Dat helpt, maar context alleen verandert nog niets in je bedrijf.',
    'Dat helpt, maar context alleen verandert nog niets in je bedrijf. Bedrijfsgeheugen koppelt die context aan wat er buiten en binnen verandert, wat geraakt wordt, welke actie nodig is en wat het resultaat daarvan was.',
    'Bedrijfsgeheugen koppelt die context aan wat er buiten en binnen verandert, wat geraakt wordt, welke actie nodig is en wat het resultaat daarvan was.',
    'Company Intelligence',
    'Dit is het productprincipe achter Bedrijfsgeheugen.',
    'De intelligentielaag is niet het eindpunt; het is de basis voor betere uitvoering.',
    'Als signalen, besluiten en kennis niet doorstromen naar uitvoering, blijft een deel van de waarde van je systemen en mensen onbenut.',
    'Daarom stuurt Bedrijfsgeheugen niet op meer documenten of meer AI-antwoorden, maar op aantoonbare acties en uitkomsten.',
    "Je krijgt direct je score, grootste risico's en drie concrete acties.",
    'Geen formulier vooraf.'
  ];
  for(const source of required) assert.ok(typeof patch[source]==='string' && patch[source].trim(), 'missing static translation: '+source);
});


test('Company Intelligence production evidence is recorded as LIVE_PROVEN',()=>{const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-30-company-brain-category-positioning-v1.json','utf8'));assert.equal(learning.production?.status,'LIVE_PROVEN');assert.equal(learning.production?.public_readback?.status,200);assert.equal(learning.production?.public_readback?.canonical,'https://www.bedrijfsgeheugen.nl/company-brain');const map=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');assert.match(map,/companyBrainCategory:Object\.freeze\(\{route:'\/company-intelligence',role:'category-acquisition-entry',status:'LIVE_PROVEN'/);});
