import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichRegisteredPage } from '../tools/seo-order-engine/enrich.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const supportEntry = {
  route: `${ORIGIN}/afas-pocket-koppelen`,
  role: 'support',
  primary_intent: 'afas pocket koppelen',
  primary_keyword: 'afas pocket koppelen',
  funnel_stage: 'consider',
  primary_cta: { action: 'afas-koppeling', url: `${ORIGIN}/afas-koppeling` },
  supporting_routes: [`${ORIGIN}/afas-koppeling`],
  schema_type: 'WebPage',
};

const base = `<!doctype html><html><head><title>AFAS Pocket koppelen</title><meta name="description" content="Pocket activeren"><link rel="canonical" href="${supportEntry.route}"></head><body><main><h1>AFAS Pocket koppelen</h1><p>Handleiding.</p></main></body></html>`;

test('supportpagina krijgt zichtbare, meetbare commerciële handoff', () => {
  const html = enrichRegisteredPage(base, supportEntry);
  assert.match(html, /data-bg-support-handoff="v1"/);
  assert.match(html, new RegExp(`href="${supportEntry.primary_cta.url}"`));
  assert.match(html, /data-bg-conversion="afas-koppeling"/);
  assert.match(html, />Hulp nodig met je AFAS-koppeling\?</);
  assert.ok(html.indexOf('data-bg-support-handoff="v1"') < html.indexOf('</main>'));
});

test('support-handoff is idempotent', () => {
  const once = enrichRegisteredPage(base, supportEntry);
  const twice = enrichRegisteredPage(once, supportEntry);
  assert.equal((twice.match(/data-bg-support-handoff="v1"/g) ?? []).length, 1);
});

test('bestaande zichtbare CTA naar hetzelfde doel wordt niet dubbel geïnjecteerd', () => {
  const withCta = base.replace('</main>', `<a href="${supportEntry.primary_cta.url}">Bekijk AFAS-koppeling</a></main>`);
  const html = enrichRegisteredPage(withCta, supportEntry);
  assert.equal((html.match(/data-bg-support-handoff="v1"/g) ?? []).length, 0);
});

test('money pages krijgen geen support-handoff', () => {
  const money = { ...supportEntry, role: 'money' };
  const html = enrichRegisteredPage(base, money);
  assert.equal((html.match(/data-bg-support-handoff="v1"/g) ?? []).length, 0);
});
