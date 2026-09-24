import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync(new URL('../assets/data/branche-applicaties.json', import.meta.url),'utf8'));
const templates=fs.readFileSync(new URL('../assets/js/koppelingen/templates.js', import.meta.url),'utf8');
const header=fs.readFileSync(new URL('../components/header/header.html', import.meta.url),'utf8');
const sitemap=fs.readFileSync(new URL('../sitemap.xml', import.meta.url),'utf8');

test('branche application registry is broad and evidence-aware',()=>{
  assert.equal(registry.version,'2026-09-24-v1');
  assert.ok(registry.sectors.length>=10);
  const apps=registry.sectors.flatMap(s=>s.apps);
  assert.ok(apps.length>=50);
  for(const sector of registry.sectors){
    assert.ok(sector.id && sector.label);
    assert.ok(sector.apps.length>=5);
    for(const app of sector.apps) assert.ok(app.id && app.name && app.category && app.integration);
  }
  for(const required of ['4ps','nedap-ons','mendrix','realworks','wincar','shopify','woocommerce','moneybird','salesforce']){
    assert.ok(apps.some(app=>app.id===required),required);
  }
});

test('portal wizard exposes sector quick starts without bypassing safe test',()=>{
  for(const id of ['bouw-4ps-datahub','zorg-nedap-ons-datahub','transport-mendrix-datahub','vastgoed-realworks-datahub','automotive-wincar-datahub']){
    assert.ok(templates.includes("template('"+id+"'"),id);
  }
  assert.ok(templates.includes("testStrategy:'safe-test'"));
});

test('public navigation and sitemap expose branch acquisition hub',()=>{
  assert.ok(header.includes('https://www.bedrijfsgeheugen.nl/koppelingen-per-branche'));
  for(const path of ['koppelingen-per-branche','bouw-software-koppelen','zorg-software-koppelen','logistiek-software-koppelen']){
    assert.ok(sitemap.includes('https://www.bedrijfsgeheugen.nl/'+path),path);
  }
});
