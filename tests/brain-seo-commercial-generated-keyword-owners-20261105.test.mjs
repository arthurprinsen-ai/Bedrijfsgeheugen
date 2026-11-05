import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ZOEKWOORD_PER_PAGINA, TITEL_PER_PAGINA, zoekwoordVoor, titelVoor } from '../tools/zoekwoorden.mjs';
import { loadRegistry } from '../tools/seo-order-engine/registry.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
const primary=[
  ['/api-koppeling-laten-maken','api koppeling laten maken'],
  ['/exact-online-koppeling','exact online koppeling'],
  ['/twinfield-koppeling','twinfield koppeling'],
  ['/webshop-koppeling','webshop koppeling mkb']
];
const baseline=JSON.parse(readFileSync('site/seo-baseline.json','utf8'));

test('generated SEO for commercial routes cannot silently contradict canonical keyword owner',async()=>{
  const registry=await loadRegistry();
  for(const [route,keyword] of primary){
    const owner=registry.pages.find(item=>item.route===ORIGIN+route);
    assert.ok(owner,'canonical owner missing for '+route);
    assert.equal(owner.role,'money');
    assert.equal(owner.primary_keyword,keyword,'canonical registry keyword mismatch on '+route);
    assert.equal(ZOEKWOORD_PER_PAGINA[route],keyword,'legacy generator must not create second keyword ownership on '+route);
    assert.equal(zoekwoordVoor(route.slice(1)+'.html'),keyword,'built HTML must preserve owner on '+route);
    assert.ok(baseline.keywordOwners.some(item=>item.route===route&&item.keyword===keyword),'baseline owner missing for '+route);
  }
});

test('general API service has a non-AFAS buyer title distinct from the AFAS service',()=>{
  const route='/api-koppeling-laten-maken';
  const title=TITEL_PER_PAGINA[route];
  assert.ok(title);
  assert.match(title,/^API-koppeling laten maken: kosten \| Bedrijfsgeheugen$/);
  assert.doesNotMatch(title,/AFAS/i,'general API page must not be mislabeled as AFAS specialist');
  assert.equal(titelVoor(route.slice(1)+'.html'),title);
  assert.equal(ZOEKWOORD_PER_PAGINA['/afas-koppeling'],'afas koppeling');
  assert.equal(ZOEKWOORD_PER_PAGINA['/blog/afas-api/'],'afas api koppeling');
});
