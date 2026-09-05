import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLinkGraph, validateMoneyPages } from '../tools/seo-order-engine/link-graph.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const registry = {
  version: 1,
  pages: [
    { route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb', secondary_keywords: [], funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [`${ORIGIN}/blog/kosten/`], schema_type: 'Service' },
    { route: `${ORIGIN}/afas-koppeling`, role: 'money', primary_intent: 'afas koppeling', primary_keyword: 'afas koppeling', secondary_keywords: [], funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [`${ORIGIN}/blog/afas/`], schema_type: 'Service' }
  ]
};

function page(canonical, links = []) {
  return { canonical, html: `<html><body><main><h1>X</h1>${links.map(url => `<a href="${url}">Link</a>`).join('')}</main></body></html>` };
}

test('link graph telt directe interne inbound en outbound links', () => {
  const pages = [page(`${ORIGIN}/blog/kosten/`, [`${ORIGIN}/prijzen`]), page(`${ORIGIN}/prijzen`, [`${ORIGIN}/frisse-blik`])];
  const graph = buildLinkGraph(pages);
  assert.deepEqual([...graph.outbound.get(`${ORIGIN}/blog/kosten/`)], [`${ORIGIN}/prijzen`]);
  assert.deepEqual([...graph.inbound.get(`${ORIGIN}/prijzen`)], [`${ORIGIN}/blog/kosten/`]);
});

test('orphaned money page wordt geweigerd', () => {
  const pages = [page(`${ORIGIN}/prijzen`), page(`${ORIGIN}/afas-koppeling`)];
  const fouten = validateMoneyPages(pages, registry).join('\n');
  assert.match(fouten, /prijzen.*orphan/i);
  assert.match(fouten, /afas-koppeling.*orphan/i);
});

test('supporting route moet daadwerkelijk naar zijn money page linken', () => {
  const pages = [page(`${ORIGIN}/prijzen`), page(`${ORIGIN}/blog/kosten/`, [`${ORIGIN}/product`]), page(`${ORIGIN}/afas-koppeling`), page(`${ORIGIN}/blog/afas/`, [`${ORIGIN}/afas-koppeling`])];
  const fouten = validateMoneyPages(pages, registry).join('\n');
  assert.match(fouten, /blog\/kosten.*mist link.*prijzen/i);
  assert.doesNotMatch(fouten, /blog\/afas.*mist link/i);
});

test('link naar bekende canonical alias wordt geweigerd ten gunste van canonical landing', () => {
  const pages = [page(`${ORIGIN}/blog/afas/`, [`${ORIGIN}/blog/afas-koppeling/`]), page(`${ORIGIN}/afas-koppeling`)];
  const fouten = validateMoneyPages(pages, registry).join('\n');
  assert.match(fouten, /canonical alias.*blog\/afas-koppeling.*afas-koppeling/i);
});
