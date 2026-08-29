import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/footer/footer.html', 'utf8');
const css = await readFile('components/footer/footer.css', 'utf8');
const contract = JSON.parse(await readFile('components/footer/contract.json', 'utf8'));

test('footer preserves baseline navigation, contact and CTA', () => {
  assert.match(html, /data-bg-component="footer"/);
  for (const heading of ['Oplossingen','Koppelingen','Kennis','Het bedrijfsgeheugen','Over ons']) assert.ok(html.includes(heading), `missing ${heading}`);
  assert.match(html, /href="\/frisse-blik"[^>]*>Plan een Frisse blik/);
  assert.match(html, /arthur@bedrijfsgeheugen\.nl/);
  assert.match(html, /06 2748 3345/);
  assert.match(html, /© 2026 Bedrijfsgeheugen\.nl|&copy; 2026 Bedrijfsgeheugen\.nl/);
});

test('footer keeps important baseline routes', () => {
  for (const href of ['/systemen-koppelen','/ai-adoptie','/afas-koppeling','/exact-online-koppeling','/blog/','/bedrijfsgeheugen','/product','/over-ons','/privacy','/contact']) {
    assert.ok(html.includes(`href="${href}"`), `missing ${href}`);
  }
});

test('footer contract and CSS are component-local', () => {
  assert.equal(contract.id, 'footer');
  assert.equal(contract.root, '[data-bg-component="footer"]');
  assert.equal(contract.jsEntry, null);
  assert.ok(contract.invariants.includes('baseline-footer-preserved'));
  assert.doesNotMatch(css, /hero-copy|hero-demo|hero-video|social-proof|bgkop/);
});
