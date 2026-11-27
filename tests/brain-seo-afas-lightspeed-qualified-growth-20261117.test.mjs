import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const canonical='https://www.bedrijfsgeheugen.nl/afas-koppeling';
const pillar='https://www.bedrijfsgeheugen.nl/systemen-koppelen';

test('existing AFAS high-intent landing has clear Lightspeed heading, distinct indexed canonical and unchanged conversion CTA',async()=>{
 const html=await read('afas-koppeling.html');
 assert.ok(html.includes('<h3>AFAS Lightspeed koppeling: webshoporders zonder overtypen</h3>'));
 assert.ok(html.includes('href="/webshop-koppeling">webshop koppelen aan je boekhouding</a>'));
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'));
 assert.ok(html.includes('data-money-primary href="/frisse-blik"'));
 assert.equal([...html.matchAll(/<h1\b/gi)].length,1);
 assert.doesNotMatch(html,/<meta[^>]+name="robots"[^>]+noindex/i);
});
test('original systems-koppelen pillar gives a contextual crawlable link to AFAS commercial owner, not an extra landing page',async()=>{
 const html=await read('systemen-koppelen.html');
 assert.ok(html.includes('href="/afas-koppeling">Lightspeed-webshop naar AFAS</a>'));
 assert.ok(html.includes('<link rel="canonical" href="'+pillar+'">'));
 const map=JSON.parse(await read('site/seo-order-map.json'));
 const owners=map.pages.filter(x=>x.route===canonical);
 assert.equal(owners.length,1);
 assert.equal(owners[0].role,'money');
 assert.equal(owners[0].primary_cta.url,'https://www.bedrijfsgeheugen.nl/frisse-blik');
});
test('technical SEO crawl entry points reflect only actual updated public canonical routes',async()=>{
 const sitemap=await read('sitemap.xml');
 const robots=await read('robots.txt');
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc><lastmod>2026-11-17</lastmod>'));
 assert.ok(sitemap.includes('<loc>'+pillar+'</loc><lastmod>2026-11-17</lastmod>'));
 assert.equal(sitemap.split('<loc>'+canonical+'</loc>').length-1,1);
 assert.ok(robots.includes('Sitemap: https://www.bedrijfsgeheugen.nl/sitemap.xml'));
 assert.ok(robots.includes('User-agent: *\nAllow: /'));
 const en=JSON.parse(await read('config/bg-static-i18n-en.d/2026-11-17-afas-lightspeed-organic-growth-v1.json'));
 assert.ok(en['AFAS Lightspeed koppeling: webshoporders zonder overtypen']);
 assert.ok(en['Lightspeed-webshop naar AFAS']);
});
test('same original acquisition to approved social/email distribution has source provenance and never fakes completed sends or traffic',async()=>{
 const policy=JSON.parse(await read('config/seo-growth-loop.json'));
 const loop=policy.optimization?.daily_search_and_ai_traffic_growth;
 assert.ok(loop,'original SEO owner rule');
 const distribution=loop.source_observed_multichannel_distribution_2026_11_17;
 assert.equal(distribution.contract,'ORIGINAL_OWNED_SEO_TO_APPROVED_CHANNELS_V1');
 assert.equal(distribution.source_observed_search_console.campaign_canonical_owner,canonical);
 assert.equal(distribution.source_observed_search_console.clicks,0);
 assert.equal(distribution.original_distribution_owners.seo_and_site.includes('BG169'),true);
 assert.equal(distribution.no_parallel_scheduler_or_marketing_writer,true);
 assert.equal(distribution.measurement.no_user_level_tracking_without_consent,true);
 assert.deepEqual(distribution.measurement.measure_windows_days,[7,14,28]);
 const learning=JSON.parse(await read('brain/learning/2026-11-17-afas-lightspeed-qualified-acquisition-v1.json'));
 assert.equal(learning.evidence.verified_organic_visitor_uplift,false);
 assert.equal(learning.evidence.provider_verified_email_or_post_dispatch_from_this_change,false);
});
