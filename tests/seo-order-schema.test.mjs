import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSeoGraph, injectSeoGraph } from '../tools/seo-order-engine/schema.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

const base = {
  canonical: `${ORIGIN}/prijzen`,
  title: 'Prijzen digitalisering mkb',
  description: 'Bekijk prijzen voor digitalisering in het mkb.',
  schema_type: 'Service',
  breadcrumbs: [
    { name: 'Home', url: `${ORIGIN}/` },
    { name: 'Prijzen', url: `${ORIGIN}/prijzen` }
  ]
};

test('SEO graph bevat vaste Organization WebSite breadcrumb en page entity ids', () => {
  const graph = renderSeoGraph(base);
  const nodes = graph['@graph'];
  assert.equal(graph['@context'], 'https://schema.org');
  assert.ok(nodes.some(n => n['@id'] === `${ORIGIN}/#organization` && n['@type'] === 'Organization'));
  assert.ok(nodes.some(n => n['@id'] === `${ORIGIN}/#website` && n['@type'] === 'WebSite'));
  assert.ok(nodes.some(n => n['@id'] === `${ORIGIN}/prijzen#breadcrumb` && n['@type'] === 'BreadcrumbList'));
  assert.ok(nodes.some(n => n['@id'] === `${ORIGIN}/prijzen#service` && n['@type'] === 'Service'));
});

test('Article graph bevat Person en Article zonder verzonnen rating', () => {
  const graph = renderSeoGraph({ ...base, canonical: `${ORIGIN}/blog/test/`, schema_type: 'Article', datePublished: '2026-09-01', dateModified: '2026-09-05' });
  const nodes = graph['@graph'];
  assert.ok(nodes.some(n => n['@id'] === `${ORIGIN}/over-ons#arthur-prinsen` && n['@type'] === 'Person'));
  assert.ok(nodes.some(n => n['@id'] === `${ORIGIN}/blog/test/#article` && n['@type'] === 'Article'));
  assert.ok(!JSON.stringify(graph).includes('aggregateRating'));
  assert.ok(!JSON.stringify(graph).includes('reviewRating'));
});

test('injectie is idempotent en vervangt alleen de eigen SEO graph', () => {
  const html = '<!doctype html><html><head><title>X</title></head><body><h1>X</h1></body></html>';
  const once = injectSeoGraph(html, base);
  const twice = injectSeoGraph(once, base);
  assert.equal(once, twice);
  assert.equal((once.match(/id="bg-seo-order-graph"/g) || []).length, 1);
});
