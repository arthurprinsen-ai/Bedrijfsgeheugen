import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VIEWS} from '../tools/v18-views-lijst.mjs';
import {renderViewSeoContextLinks,assertViewSeoContextLinksRendered} from '../tools/v18-seo-context-links.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('original V18 generated /systemen-koppelen—not stale checked-in HTML—owns the AFAS contextual link',async()=>{
 const v=VIEWS.find(x=>x.pad==='/systemen-koppelen');
 assert.ok(v,'V18 generator owns the public systems page');
 assert.equal(v.bestand,'systemen-koppelen.html');
 assert.equal(v.zoekwoord,'systemen koppelen mkb');
 assert.deepEqual(v.seoContextLinks,[{href:'/afas-koppeling',label:'Lightspeed-webshop naar AFAS'}]);
 const html=renderViewSeoContextLinks(v.seoContextLinks);
 assert.equal(assertViewSeoContextLinksRendered(html,v.seoContextLinks),true);
 assert.match(html,/<nav class="wrap v18-view-seo-context" /);
 assert.match(html,/<a href="\/afas-koppeling">Lightspeed-webshop naar AFAS<\/a>/);
 assert.equal((html.match(/\/afas-koppeling/g)||[]).length,1);
 assert.doesNotMatch(html,/rel="nofollow"|noindex|target="_blank"|data-view=/);
 const builder=await read('tools/bouw-v18-views.mjs');
 assert.match(builder,/renderViewSeoContextLinks\(p\.seoContextLinks\)/);
 assert.match(builder,/assertViewSeoContextLinksRendered\(html, p\.seoContextLinks\)/);
 assert.ok(builder.indexOf('assertViewSeoContextLinksRendered(html, p.seoContextLinks)')<builder.indexOf("await writeFile(p.bestand, html, 'utf8')"));
});
test('SEO context link generator rejects duplicate, unsafe, or invisible linking and preserves all other views',()=>{
 assert.equal(renderViewSeoContextLinks([]),'');
 assert.throws(()=>renderViewSeoContextLinks([{href:'https://evil.example',label:'external site'}]),/ROUTE_INVALID/);
 assert.throws(()=>renderViewSeoContextLinks([{href:'/afas-koppeling',label:'valid label'},{href:'/afas-koppeling',label:'duplicate label'}]),/DUPLICATE_ROUTE/);
 assert.throws(()=>assertViewSeoContextLinksRendered('<main>No generated internal SEO link</main>',[{href:'/afas-koppeling',label:'Lightspeed-webshop naar AFAS'}]),/NOT_IN_GENERATED_SITE/);
 assert.deepEqual(VIEWS.filter(v=>v.seoContextLinks?.length).map(v=>v.pad),['/systemen-koppelen']);
});
test('original canonical/intent owner remains unique, translations and first-party lead CTA remain unchanged',async()=>{
 const map=JSON.parse(await read('site/seo-order-map.json'));
 const afas='https://www.bedrijfsgeheugen.nl/afas-koppeling';
 const owner=map.pages.filter(x=>x.route===afas);
 assert.equal(owner.length,1,'no duplicate landing route');
 assert.equal(owner[0].primary_cta.url,'https://www.bedrijfsgeheugen.nl/frisse-blik');
 const en=JSON.parse(await read('config/bg-static-i18n-en.d/2026-11-17-afas-lightspeed-organic-growth-v1.json'));
 assert.equal(en['Lightspeed-webshop naar AFAS'],'Lightspeed webshop to AFAS');
 assert.equal(en['Gerelateerde systeemkoppelingen'],'Related system integrations');
 const learning=JSON.parse(await read('brain/learning/2026-11-17-seo-v18-rendered-pillar-link-v1.json'));
 assert.equal(learning.evidence.extra_organic_visitors_proven,false);
 assert.equal(learning.evidence.post_or_email_proven_by_this_release,false);
});
