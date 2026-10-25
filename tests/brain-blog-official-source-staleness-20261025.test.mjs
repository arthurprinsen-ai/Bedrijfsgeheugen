import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const article=readFileSync(new URL('../blog/publiceren-voor-de-circular-plastics-nl-kans-beslis-alleen-als-kanaalg/index.html',import.meta.url),'utf8');
const index=readFileSync(new URL('../blog/index.html',import.meta.url),'utf8');
const rss=readFileSync(new URL('../blog/rss.xml',import.meta.url),'utf8');
const schema=JSON.parse(article.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/)?.[1]||'{}');
test('daily article correctly marks expired CPNL source and keeps source URLs',()=>{
 assert.match(article,/21 april om 09\\.00 uur tot en met 6 oktober om 17\\.00 uur/);
 assert.match(article,/25 oktober 2026 is die aanvraagtermijn dus verlopen/);
 assert.match(article,/https:\\/\\/www\\.rvo\\.nl\\/subsidies-financiering\\/cpnl/);
 assert.match(article,/SOPV/);
 assert.match(article,/EKOO: Circulaire economie/);
});
test('no internal forecasting, invented rates, or reopening claim leaks into reader article',()=>{
 for(const token of ['forecast_id','expected_revenue_eur','verified_qualified_cta_progression','kanaalgatesstatus','waarschijnlijk op 6 oktober 2026 opengaan','Editor’s single testchange']) assert.equal(article.includes(token),false,token);
 assert.equal((article.match(/<h2[ >]/g)||[]).length>=3,true);
 assert.match(article,/href="\\/frisse-blik"/);
 assert.match(article,/href="\\/zelfscan"/);
});
test('RSS/index/metadata/FAQ link to same corrected customer-facing article',()=>{
 assert.match(index,/Circular Plastics NL 2026 gesloten: wat kun je nu doen\\?/);
 assert.match(rss,/Circular Plastics NL 2026 gesloten: wat kun je nu doen\\?/);
 assert.equal(schema['@graph'][0].headline,'Circular Plastics NL 2026 gesloten: wat kun je nu doen?');
 assert.ok(schema['@graph'][0].citation.includes('https://www.rvo.nl/subsidies-financiering/cpnl'));
 assert.equal(schema['@graph'][1]['@type'],'FAQPage');
});
