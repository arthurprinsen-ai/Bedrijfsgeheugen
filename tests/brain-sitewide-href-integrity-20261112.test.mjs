import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditRenderedHrefs, normalizedSeoRoute } from '../tools/site-shell/sitewide-href-integrity.mjs';

const sitemapRoutes=['/','/prijzen','/afas-koppeling','/blog/bronartikel/','/en/prijzen','/en/blog/bronartikel/'];
const check=(hrefs,route='/prijzen')=>auditRenderedHrefs({route,hrefs,sitemapRoutes,expectedCount:hrefs.length});

test('published NL and generated EN canonical page hrefs share full sitemap coverage',()=>{
  const hrefs=['https://www.bedrijfsgeheugen.nl/','/afas-koppeling',
    'https://www.bedrijfsgeheugen.nl/blog/bronartikel/',
    'https://www.bedrijfsgeheugen.nl/en/prijzen?test=1','#prijzen','mailto:info@example.com',
    'tel:+31000000000','https://example.org/source'];
  const r=check(hrefs);
  assert.deepEqual(r.failures,[]);
  assert.equal(r.hrefsChecked,8);
  assert.equal(r.internal,4);
  assert.equal(r.external,1);
  assert.deepEqual(check(['/en/prijzen'],'/en/blog/bronartikel/').failures,[]);
  assert.equal(normalizedSeoRoute('/en/prijzen/'),'/en/prijzen');
});

test('rejects unsafe, incomplete and noncanonical rendered hrefs without discarding any source route',()=>{
  for(const href of ['', '#', 'javascript:void(0)', 'data:text/html,test',
    'http://example.org', '//example.org/path','relatieve-link',
    'https://bedrijfsgeheugen.nl/prijzen','https://www.bedrijfsgeheugen.nl/niet-gepubliceerd']) {
    const report=check([href]);
    assert.ok(report.failures.length>0,'must reject '+JSON.stringify(href));
  }
  assert.ok(check(['https://www.bedrijfsgeheugen.nl/prijzen'],'/unknown').failures.includes('SOURCE_ROUTE_NOT_IN_FINAL_SITEMAP'));
  const truncated=auditRenderedHrefs({route:'/prijzen',hrefs:['/prijzen'],sitemapRoutes,expectedCount:2});
  assert.ok(truncated.failures.includes('HREF_INVENTORY_INCOMPLETE'));
});

test('functional portal and static asset links do not masquerade as missing SEO canonicals',()=>{
  const r=check(['https://www.bedrijfsgeheugen.nl/portal-v2/',
    '/assets/logo.svg','/api/growth-event','/klantportaal','/offerte']);
  assert.deepEqual(r.failures,[]);
});

test('existing sitewide browser gate must audit ALL rendered routes, NL and EN, with exact href counts',()=>{
  const browser=readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');
  assert.match(browser,/auditRenderedHrefs/);
  assert.match(browser,/hrefsChecked/);
  assert.match(browser,/expectedCount:state\.hrefCount/);
  assert.match(browser,/sitemapRoutes:routes/);
  assert.match(browser,/viewport\.name==='desktop'/);
  assert.match(browser,/hrefs: Array\.from\(document\.querySelectorAll\('a\[href\]'\)\)/);
});
