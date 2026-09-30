import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Company Brain category page owns the intent and routes to existing revenue funnel',()=>{
  const html=fs.readFileSync('company-brain.html','utf8');
  assert.match(html,/canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/company-brain"/);
  assert.match(html,/Een Company Brain is waar Bedrijfsgeheugen begint\./);
  assert.match(html,/Weten → Zien → Begrijpen → Doen → Leren/);
  assert.match(html,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
  assert.doesNotMatch(html,/garandeer|gegarandeerd|beste Company Brain/i);
});

test('homepage post-build authority projects Company Brain positioning',()=>{
  const src=fs.readFileSync('tools/bouw-v18-ai-ecosysteem.mjs','utf8');
  assert.match(src,/Meer dan een Company Brain\./);
  assert.match(src,/https:\/\/www\.bedrijfsgeheugen\.nl\/company-brain/);
  assert.match(src,/intelligence- en uitvoeringsmotor/);
  assert.match(src,/Je bedrijf weet meer dan het gebruikt/);
});

test('SEO and Brain authorities inherit category-to-revenue contract',()=>{
  const map=JSON.parse(fs.readFileSync('site/seo-order-map.json','utf8'));
  const owner=map.pages.find(p=>p.primary_keyword==='company brain');
  assert.equal(owner?.route,'https://www.bedrijfsgeheugen.nl/company-brain');
  assert.equal(owner?.primary_cta?.url,'https://www.bedrijfsgeheugen.nl/zelfscan');
  const growth=JSON.parse(fs.readFileSync('config/seo-growth-loop.json','utf8'));
  assert.equal(growth.optimization.category_capture.company_brain.product_rename_forbidden,true);
  assert.deepEqual(growth.optimization.category_capture.company_brain.terminal_outcomes,['paid_order','realized_revenue']);
  assert.match(fs.readFileSync('AGENTS.md','utf8'),/commercial-positioning\|company-brain-to-bedrijfsgeheugen\|orders-loop\|v1/);
  assert.match(fs.readFileSync('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md','utf8'),/seo\|company-brain\|category-capture-to-revenue\|v1/);
  assert.match(fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8'),/companyBrainCanonicalOwner:'\/company-brain'/);
});

test('accepted website baseline includes Company Brain route',()=>{
  const baseline=JSON.parse(fs.readFileSync('site/accepted-baseline.json','utf8'));
  assert.ok(baseline.routes.some(r=>r.route==='/company-brain' && r.file==='company-brain.html'));
});


test('delivery classifier recognizes the new public page',()=>{
  const delivery=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const website=delivery.lanes.find(lane=>lane.id==='website');
  assert.ok(website?.paths.includes('company-brain.html'));
});
