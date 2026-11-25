import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const article=readFileSync(new URL('../blog/publiceren-voor-de-circular-plastics-nl-kans-beslis-alleen-als-kanaalg/index.html',import.meta.url),'utf8');
const index=readFileSync(new URL('../blog/index.html',import.meta.url),'utf8');
const rss=readFileSync(new URL('../blog/rss.xml',import.meta.url),'utf8');
const schemaSource=article.split('<script type="application/ld+json">')[1]?.split('</script>')[0];
const schema=JSON.parse(schemaSource||'{}');
test('daily article correctly marks expired CPNL and cites official sources',()=>{
 assert.ok(article.includes('21 april om 09.00 uur tot en met 6 oktober om 17.00 uur'));
 assert.ok(article.includes('25 oktober 2026 is die aanvraagtermijn dus verlopen'));
 assert.match(article, /<a\s+[^>]*href="https:\/\/www\.rvo\.nl\/subsidies-financiering\/cpnl"/);
 assert.ok(article.includes('SOPV'));
 assert.ok(article.includes('EKOO: Circulaire economie'));
});
test('no internal forecast metrics or false opening claim in reader content',()=>{
 const publicText=article.split('<article class="artikel"')[1]?.split('</article>')[0]||'';
 for(const token of ['forecast_id','expected_revenue_eur','verified_qualified_cta_progression','kanaalgatesstatus','waarschijnlijk op 6 oktober 2026 opengaan','Editor’s single testchange']) assert.equal(publicText.includes(token),false,token);
 assert.ok(publicText.split('<h2').length>=4);
 assert.ok(publicText.includes('href="/frisse-blik"'));
 assert.ok(publicText.includes('href="/zelfscan"'));
});
test('RSS/index/JSON-LD carry the same corrected page identity',()=>{
 const heading='Circular Plastics NL 2026 gesloten: wat kun je nu doen?';
 assert.ok(index.includes(heading));
 assert.ok(rss.includes(heading));
 assert.equal(schema['@graph'][0].headline,heading);
 assert.ok(Array.isArray(schema['@graph'][0].citation));
 assert.ok(schema['@graph'][0].citation.some(url => url === 'https://www.rvo.nl/subsidies-financiering/cpnl'));
 assert.equal(schema['@graph'][1]['@type'],'FAQPage');
});
