import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL('../'+path, import.meta.url),'utf8');
const moneyPages = [
  ['exact-online-koppeling.html','/exact-online-koppeling'],
  ['twinfield-koppeling.html','/twinfield-koppeling'],
  ['api-koppeling-laten-maken.html','/api-koppeling-laten-maken'],
];
const price = 'Voor een koppeling in één richting ligt de indicatie doorgaans tussen € 3.500 en € 6.000. Met twee richtingen of complexe uitzonderingen kan dat oplopen tot ongeveer € 12.000. Je krijgt vooraf een vaste prijs op basis van de afgesproken scope.';
const origin='https://www.bedrijfsgeheugen.nl';

for (const [path,route] of moneyPages) {
  test(path+' preserves ONE canonical Koppelingen breadcrumb, truthful price and conversion',async()=>{
    const html=await read(path);
    const navs=[...html.matchAll(/<nav class="bgkruim"[^>]*>[\s\S]*?<\/nav>/g)].map(x=>x[0]);
    assert.equal(navs.length,1,'one visible breadcrumb only');
    assert.ok(navs[0].includes('href="'+origin+'/">Home'));
    assert.ok(navs[0].includes('href="'+origin+'/systemen-koppelen">Koppelingen'));
    assert.doesNotMatch(navs[0],/AI in business intelligence|AI &amp; Governance/);
    assert.ok(html.includes('<link rel="canonical" href="'+origin+route+'">'));
    assert.equal(html.split(price).length-1,2,'visible FAQ and original FAQ schema must agree');
    assert.doesNotMatch(html,/vijftien honderd en vijfduizend euro/i);
    assert.ok(html.includes('href="/frisse-blik"'),'original qualifying CTA remains');
    const ld=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map(x=>{try{return JSON.parse(x[1]);}catch{return null;}}).filter(Boolean)
      .flatMap(j=>Array.isArray(j['@graph'])?j['@graph']:[j]);
    const faq=ld.find(j=>j['@type']==='FAQPage');
    assert.ok(faq,'valid FAQ schema');
    assert.ok(faq.mainEntity.some(item=>item.acceptedAnswer?.text===price),'FAQ JSON-LD must match visible price');
  });
}
test('V18 generator does not prefer obsolete first breadcrumb and supports absolute URLs',async()=>{
  const selected=await read('tools/bouw-v18-chrome-alles.mjs');
  const schemas=await read('tools/bouw-v18-chrome.mjs');
  assert.ok(selected.includes('integrationOwner ? trails.at(-1) : trails[0]'));
  assert.ok(schemas.includes("? s.url : 'https://www.bedrijfsgeheugen.nl' + s.url"));
});
test('commercial price comes from central existing guide with static EN translation',async()=>{
 const map=JSON.parse(await read('config/bg-static-i18n-en.d/2026-11-12-seo-money-page-trust-v1.json'));
 assert.ok(map[price]?.includes('€12,000'));
 const guide=await read('systemen-koppelen.html');
 assert.ok(guide.includes('€ 3.500 tot € 6.000'));
 assert.ok(guide.includes('€ 12.000'));
});
