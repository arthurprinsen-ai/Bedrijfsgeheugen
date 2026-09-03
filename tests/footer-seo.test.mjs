import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateFooterSeo } from '../tools/validate-footer-seo.mjs';

const contract = JSON.parse(readFileSync('site/footer-contract.json', 'utf8'));
const seo = JSON.parse(readFileSync('site/seo-baseline.json', 'utf8'));
const canonical = readFileSync('.github/canoniek/voet.html', 'utf8');

test('canonical footer passes SEO ownership with all routes resolvable', async () => {
  const errors = await validateFooterSeo({ footerHtml: canonical, contract, seo, routeExists: async () => true });
  assert.deepEqual(errors, []);
});

test('dead footer route is blocked', async () => {
  const broken = canonical.replace('href="/contact"', 'href="/does-not-exist"');
  const errors = await validateFooterSeo({ footerHtml: broken, contract, seo, routeExists: async r => r !== '/does-not-exist' });
  assert.ok(errors.some(x => x.includes('rule=dead-route')));
});

test('missing strategic destination is blocked', async () => {
  const broken = canonical.replace(/<a href="\/ai-governance">[\s\S]*?<\/a>/, '');
  const errors = await validateFooterSeo({ footerHtml: broken, contract, seo, routeExists: async () => true });
  assert.ok(errors.some(x => x.includes('missing-strategic-destination')));
});

test('exact keyword anchor may not point to the wrong owner', async () => {
  const broken = canonical.replace('<a href="/data-soevereiniteit">Data-soevereiniteit</a>', '<a href="/over-ons">data soevereiniteit</a>');
  const errors = await validateFooterSeo({ footerHtml: broken, contract, seo, routeExists: async () => true });
  assert.ok(errors.some(x => x.includes('exact-anchor-wrong-owner')));
});
