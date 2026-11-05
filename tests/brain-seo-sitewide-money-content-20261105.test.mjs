import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry } from '../tools/seo-order-engine/registry.mjs';
import { enrichMoneyPage, inspectMoneyPage } from '../tools/seo-order-engine/money-contract-v2.mjs';

const registry=await loadRegistry();
const routeNames=['afas-koppeling','exact-online-koppeling','twinfield-koppeling','bedrijfsprocessen-automatiseren','webshop-koppeling','power-bi-implementatie','ai-implementeren'];

for(const slug of routeNames){
  test('commerciële bronroute '+slug+' blijft begrijpelijk voor echte koper',()=>{
    const route='https://www.bedrijfsgeheugen.nl/'+slug;
    const entry=registry.pages.find(row=>row.route===route);
    assert.ok(entry,'bestaande money owner ontbreekt: '+slug);
    const support=(entry.supporting_routes||[])[0]||'https://www.bedrijfsgeheugen.nl/prijzen';
    const html='<html><head><title>SEO buyer example</title><meta name="description" content="Buyer example"></head><body><main><h1>'+slug+'</h1><section data-bg-evidence="source"><h2>Voorbeeld</h2><p>Inhoudelijke toets van de koppeling.</p></section><a href="'+support+'">Lees meer</a></main></body></html>';
    const result=enrichMoneyPage(html,entry);
    assert.match(result,/data-bg-money-section="problem"/);
    assert.match(result,/Waar gaat het in de praktijk mis\?/);
    assert.match(result,/data-bg-author="bedrijfsgeheugen"/);
    assert.match(result,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/over-ons"/);
    assert.match(result,/data-bg-money-section="method"/);
    assert.match(result,/Zo toetsen we jouw situatie/);
    assert.doesNotMatch(result,/Deze pagina is de primaire eigenaar van deze zoekintentie|Het zoekprobleem:|Inhoudelijk gereviewd door|Laatste inhoudelijke publicatiecontrole/);
    assert.deepEqual(inspectMoneyPage(result,entry),[]);
    assert.equal(enrichMoneyPage(result,entry),result);
  });
}

test('ook onbekende intent mag geen interne SEO-instructies op de site tonen',()=>{
  const entry={route:'https://www.bedrijfsgeheugen.nl/overzicht',role:'money',primary_intent:'bedrijfsadvies op maat',funnel_stage:'consider',primary_cta:{action:'frisse-blik',url:'https://www.bedrijfsgeheugen.nl/frisse-blik'},supporting_routes:['https://www.bedrijfsgeheugen.nl/prijzen']};
  const result=enrichMoneyPage('<html><body><main><h1>Advies</h1></main></body></html>',entry);
  assert.match(result,/Welke handmatige stap veroorzaakt vertraging/);
  assert.doesNotMatch(result,/Deze pagina is de primaire eigenaar|reviewdatum/i);
});
