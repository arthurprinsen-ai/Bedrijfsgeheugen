import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/hero-demo/hero-demo.html', 'utf8');
const css = await readFile('components/hero-demo/hero-demo.css', 'utf8');
const contract = JSON.parse(await readFile('components/hero-demo/contract.json', 'utf8'));

test('hero demo preserves baseline Jansen Bouw answer flow', () => {
  assert.match(html, /data-bg-component="hero-demo"/);
  assert.match(html, /Welke prijsafspraken hebben we met Jansen Bouw\?/);
  assert.match(html, /12%/);
  assert.match(html, /30 dagen/);
  assert.match(html, /31-12-2026/);
  for (const source of ['Outlook','SharePoint','AFAS']) assert.ok(html.includes(source), `missing source ${source}`);
  for (const action of ['Stel een vervolgvraag','Open in SharePoint','Maak een taak aan']) assert.ok(html.includes(action), `missing action ${action}`);
});

test('hero demo never owns the hero video', () => {
  assert.doesNotMatch(html, /<video\b|openart-hero|hero-product-video|hero-media-frame/);
  assert.doesNotMatch(css, /hero-video|hero-product-video|hero-media-frame|bgkop|bgvoet/);
});

test('hero demo exposes a dedicated integration slot without sibling styling', () => {
  assert.match(html, /data-bg-slot="hero-video"/);
  assert.equal(contract.id, 'hero-demo');
  assert.equal(contract.root, '[data-bg-component="hero-demo"]');
  assert.equal(contract.jsEntry, null);
  assert.ok(contract.invariants.includes('no-video-ownership'));
  assert.ok(contract.invariants.includes('baseline-demo-preserved'));
});
