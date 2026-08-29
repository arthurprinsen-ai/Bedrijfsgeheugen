import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/social-proof/social-proof.html', 'utf8');
const css = await readFile('components/social-proof/social-proof.css', 'utf8');
const contract = JSON.parse(await readFile('components/social-proof/contract.json', 'utf8'));

test('social proof preserves baseline people, stars and trust text', () => {
  assert.match(html, /data-bg-component="social-proof"/);
  for (const n of [1,2,3,4]) assert.match(html, new RegExp(`/assets/mensen/${n}\\.jpg`));
  assert.equal((html.match(/<img\b/g) || []).length, 4);
  assert.match(html, /★★★★★/);
  assert.match(html, /Vertrouwd door organisaties in het mkb/);
});

test('social proof remains independent from hero copy, demo and video', () => {
  assert.doesNotMatch(html, /<video\b|Jansen Bouw|Laat Arthur meekijken|Doe eerst de Frisse blik/);
  assert.doesNotMatch(css, /hero-copy|hero-demo|hero-video|bgkop|bgvoet/);
});

test('social proof contract is isolated and script-free', () => {
  assert.equal(contract.id, 'social-proof');
  assert.equal(contract.root, '[data-bg-component="social-proof"]');
  assert.equal(contract.jsEntry, null);
  assert.ok(contract.invariants.includes('baseline-trust-proof-preserved'));
  assert.ok(contract.invariants.includes('no-sibling-component-selectors'));
});
