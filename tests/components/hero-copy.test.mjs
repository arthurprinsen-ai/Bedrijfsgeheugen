import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/hero-copy/hero-copy.html', 'utf8');
const css = await readFile('components/hero-copy/hero-copy.css', 'utf8');
const contract = JSON.parse(await readFile('components/hero-copy/contract.json', 'utf8'));

test('hero copy preserves baseline proposition, USPs and CTA destinations', () => {
  assert.match(html, /data-bg-component="hero-copy"/);
  assert.match(html, /Voor het mkb/);
  assert.match(html, /Je bedrijf heeft een[\s\S]*geheugen[\s\S]*De vraag is hoeveel ervan in mensen zit\./);
  assert.match(html, /Aanpakken zonder aanmodderen\./);
  assert.match(html, /Klantafspraken in één mailbox/);
  assert.match(html, /Wij maken zichtbaar wat er in hoofden zit/);
  for (const usp of [
    'Vind direct wat je nodig hebt',
    'Veilig &amp; betrouwbaar',
    'Van inzicht naar actie',
    'Kennis blijft behouden'
  ]) assert.ok(html.includes(usp), `missing USP: ${usp}`);
  assert.match(html, /href="\/contact"[^>]*>Laat Arthur meekijken/);
  assert.match(html, /href="\/frisse-blik"[^>]*>Doe eerst de Frisse blik/);
});

test('hero copy does not own demo, video or social proof', () => {
  assert.doesNotMatch(html, /<video\b|Jansen Bouw|vertrouwen|★★★★★/);
  assert.doesNotMatch(css, /hero-demo|hero-video|social-proof|bgkop|bgvoet/);
});

test('hero copy contract is isolated and script-free', () => {
  assert.equal(contract.id, 'hero-copy');
  assert.equal(contract.root, '[data-bg-component="hero-copy"]');
  assert.equal(contract.jsEntry, null);
  assert.ok(contract.invariants.includes('baseline-copy-preserved'));
  assert.ok(contract.invariants.includes('no-sibling-component-selectors'));
});
