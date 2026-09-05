import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRegistry } from '../tools/seo-order-engine/registry.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

function geldigeRegistry() {
  return {
    version: 1,
    pages: [
      {
        route: `${ORIGIN}/`, role: 'pillar', primary_intent: 'digitalisering mkb', primary_keyword: 'digitalisering mkb',
        secondary_keywords: ['mkb digitaliseren'], funnel_stage: 'discover',
        primary_cta: { action: 'zelfscan', url: `${ORIGIN}/gratis-zelfscan` },
        supporting_routes: [`${ORIGIN}/prijzen`], schema_type: 'WebPage'
      },
      {
        route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb',
        secondary_keywords: ['prijzen digitalisering mkb'], funnel_stage: 'decide',
        primary_cta: { action: 'frisse-blik-scan', url: `${ORIGIN}/aanmelden` },
        supporting_routes: [`${ORIGIN}/`], schema_type: 'Service'
      }
    ]
  };
}

test('geldige intent registry wordt geaccepteerd', () => {
  assert.deepEqual(validateRegistry(geldigeRegistry()), []);
});

test('duplicate primary intent en keyword worden geweigerd', () => {
  const r = geldigeRegistry();
  r.pages[1].primary_intent = r.pages[0].primary_intent;
  r.pages[1].primary_keyword = r.pages[0].primary_keyword;
  const fouten = validateRegistry(r).join('\n');
  assert.match(fouten, /duplicate primary_intent/i);
  assert.match(fouten, /duplicate primary_keyword/i);
});

test('route, CTA en supporting routes moeten volledige bedrijfsgeheugen URLs zijn', () => {
  const r = geldigeRegistry();
  r.pages[0].route = '/';
  r.pages[0].primary_cta.url = '/gratis-zelfscan';
  r.pages[0].supporting_routes = ['/prijzen'];
  const fouten = validateRegistry(r).join('\n');
  assert.match(fouten, /route moet absolute/i);
  assert.match(fouten, /primary_cta.url moet absolute/i);
  assert.match(fouten, /supporting_routes.*absolute/i);
});
