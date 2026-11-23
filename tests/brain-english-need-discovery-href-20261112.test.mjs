import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditRenderedHrefs} from '../tools/site-shell/sitewide-href-integrity.mjs';

const builder=readFileSync(new URL('../tools/site-shell/build-localized-routes.mjs',import.meta.url),'utf8');
const runtime=readFileSync(new URL('../assets/js/i18n.js',import.meta.url),'utf8');
const contact=readFileSync(new URL('../contact.html',import.meta.url),'utf8');
const check=href=>auditRenderedHrefs({route:'/en/contact',hrefs:[href],sitemapRoutes:['/en/contact'],expectedCount:1});

test('original public need-discovery utility is legal on EN contact without inventing an EN route',()=>{
  const good=check('https://www.bedrijfsgeheugen.nl/behoeftecheck');
  assert.deepEqual(good.failures,[]);
  const broken=check('/en/behoeftecheck');
  assert.ok(broken.failures.includes('INTERNAL_TARGET_NOT_IN_FINAL_SITEMAP:/en/behoeftecheck'));
  assert.match(contact,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/behoeftecheck"/);
});

test('existing static NL/EN renderer preserves exact original canonical HTTPS utility route',()=>{
  assert.match(builder,/normalizedRoute\(resolved\.path\) === '\/behoeftecheck'/);
  assert.match(builder,/a\.value = SITE \+ '\/behoeftecheck' \+ resolved\.suffix/);
  assert.ok(builder.indexOf("normalizedRoute(resolved.path) === '/behoeftecheck'") < builder.indexOf('const targetFile = aliases.get(resolved.path)'));
});

test('existing browser locale synchronization preserves same NL-only utility in both link and language paths',()=>{
  assert.match(runtime,/NL_ONLY_UTILITY_ROUTES = new Set\(\['\/behoeftecheck'\]\)/);
  assert.match(runtime,/NL_ONLY_UTILITY_ROUTES\.has\(key\)/);
  assert.match(runtime,/NL_ONLY_UTILITY_ROUTES\.has\(strippedKey\)/);
  assert.match(runtime,/https:\/\/www\.bedrijfsgeheugen\.nl\/behoeftecheck/);
  assert.doesNotMatch(runtime,/\/en\/behoeftecheck/);
});
