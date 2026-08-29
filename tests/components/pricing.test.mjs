import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/pricing/pricing.html', 'utf8');
const css = await readFile('components/pricing/pricing.css', 'utf8');
const contract = JSON.parse(await readFile('components/pricing/contract.json', 'utf8'));

test('pricing preserves the current Frisse Blik Scan offer and prices', () => {
  assert.match(html, /data-bg-component="pricing"/);
  assert.match(html, /Start met de Frisse Blik Scan/);
  assert.match(html, /€ 2\.900/);
  assert.match(html, /op afstand € 2\.400/);
  assert.match(html, /Excl\. btw/);
  assert.match(html, /inclusief rapport en advies/);
});

test('pricing preserves baseline inclusions and CTA destinations', () => {
  for (const inclusion of [
    'Scan van je kennisstromen en zoekgedrag',
    "Inzicht in verspilling en risico's",
    'Concrete besparingskansen',
    'Vrijblijvend en kosteloos gesprek vooraf'
  ]) assert.ok(html.includes(inclusion), `missing inclusion: ${inclusion}`);
  assert.match(html, /href="\/frisse-blik"[^>]*>Plan de scan/);
  assert.match(html, /href="\/zelfscan"[^>]*>gratis zelfscan/);
});

test('pricing does not own adjacent logo proof or memo content', () => {
  assert.doesNotMatch(html, /KROON BOUW|VAN DER HELM|WITZAND|TRIPLE A|DE JONG &amp; LAAN|Binnen 2 weken helderheid/);
  assert.doesNotMatch(css, /hero-copy|hero-demo|hero-video|social-proof|bgkop|bgvoet/);
});

test('pricing contract is isolated and script-free', () => {
  assert.equal(contract.id, 'pricing');
  assert.equal(contract.root, '[data-bg-component="pricing"]');
  assert.equal(contract.jsEntry, null);
  assert.ok(contract.invariants.includes('baseline-frisse-blik-pricing-preserved'));
  assert.ok(contract.invariants.includes('no-sibling-component-selectors'));
});
