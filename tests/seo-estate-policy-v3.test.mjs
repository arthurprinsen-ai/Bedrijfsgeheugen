import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadRegistry } from '../tools/seo-order-engine/registry.mjs';
import { classifyCanonical } from '../tools/seo-order-engine/page-policy.mjs';
import { enrichMoneyPage, inspectMoneyPage } from '../tools/seo-order-engine/money-contract-v2.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';

function sitemapUrls(xml){return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);}

test('iedere huidige sitemap-pagina heeft SEO/CRO-classificatie', async()=>{
  const [xml,registry]=await Promise.all([readFile('sitemap.xml','utf8'),loadRegistry()]);
  const unknown=[];
  for(const url of sitemapUrls(xml)){
    if(url.startsWith(`${ORIGIN}/blog/`) && url!==`${ORIGIN}/blog/`) continue;
    if(!classifyCanonical(url,registry)) unknown.push(url);
  }
  assert.deepEqual(unknown,[]);
});

test('toekomstige informatieve pagina wordt automatisch supporting; commerciële kandidaat faalt gesloten', async()=>{
  const registry=await loadRegistry();
  const support=classifyCanonical(`${ORIGIN}/oplossingen/proces`,registry);
  assert.equal(support?.page_class,'support');
  assert.equal(support?.owner,`${ORIGIN}/`);
  assert.equal(classifyCanonical(`${ORIGIN}/nieuwe-ai-implementeren`,registry),null);
});

test('high-intent uitbreiding staat als money geregistreerd', async()=>{
  const registry=await loadRegistry();
  const required=['/ai-implementeren','/ai-scan','/ai-poc','/ai-governance','/business-case-ai','/due-diligence','/investeerders-ma','/systemen-koppelen','/webshop-koppeling','/workshops'];
  for(const path of required){
    const entry=registry.pages.find(p=>p.route===`${ORIGIN}${path}`);
    assert.equal(entry?.role,'money',`${path} moet money zijn`);
  }
});

test('money contract bevat direct antwoord FAQ methode en update-signaal',()=>{
  const entry={route:`${ORIGIN}/ai-implementeren`,role:'money',primary_intent:'ai implementatie mkb',primary_keyword:'ai implementatie mkb',secondary_keywords:[],funnel_stage:'decide',primary_cta:{action:'frisse-blik',url:`${ORIGIN}/frisse-blik`},supporting_routes:[`${ORIGIN}/ai-adoptie`],schema_type:'Service'};
  const base=`<!doctype html><html><head><title>AI implementeren</title><meta name="description" content="AI"><link rel="canonical" href="${entry.route}"></head><body><main><h1>AI implementeren in het mkb</h1><section class="bewijs"><h2>Praktijkvoorbeeld</h2><table><tr><td>voorbeeld</td></tr></table></section></main></body></html>`;
  const html=enrichMoneyPage(base,entry);
  assert.match(html,/data-bg-money-contract-version="v3"/);
  assert.match(html,/data-bg-money-section="answer"/);
  assert.match(html,/data-bg-money-section="faq"/);
  assert.match(html,/data-bg-money-section="method"/);
  assert.match(html,/data-bg-content-updated=/);
  assert.deepEqual(inspectMoneyPage(html,entry),[]);
});
