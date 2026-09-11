import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { metConversieknop, CTA_CSS_HREF, CTA_MARKER, PORTAAL } from '../tools/site-shell/cta-conversie.mjs';

const luminantie = hex => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [l1, l2] = [luminantie(a), luminantie(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

test('koppelt de conversieknop precies één keer, vlak voor </head>', () => {
  const een = metConversieknop('<html><head><title>x</title></head><body></body></html>');
  assert.ok(een.includes(`<link rel="stylesheet" href="${CTA_CSS_HREF}" ${CTA_MARKER}>\n</head>`));
  assert.equal(metConversieknop(een), een);
  assert.equal(een.split(CTA_MARKER).length - 1, 1);
});

test('pagina zonder <head> blijft ongemoeid', () => {
  assert.equal(metConversieknop('<p>fragment</p>'), '<p>fragment</p>');
});

test('klantportaal valt buiten de conversieknop', () => {
  for (const p of ['klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']) assert.ok(PORTAAL.has(p));
});

test('knoptekst is leesbaar op oranje, normaal en bij hover (WCAG AA 4,5:1)', async () => {
  const css = await readFile(new URL('../assets/cta-conversie.css', import.meta.url), 'utf8');
  const waarde = naam => css.match(new RegExp(`--${naam}:(#[0-9A-Fa-f]{6})`))[1];
  assert.ok(contrast(waarde('conversie'), waarde('conversie-tekst')) >= 4.5);
  assert.ok(contrast(waarde('conversie-hover'), waarde('conversie-tekst')) >= 4.5);
});

test('gekozen filterchip en omlijnde knop blijven buiten de knopregel', async () => {
  const css = await readFile(new URL('../assets/cta-conversie.css', import.meta.url), 'utf8');
  const regels = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!regels.includes('ask-chip'));
  assert.ok(regels.includes('.kaart .knop:not(.leeg)'));
});

test('de laatste buildstap roept de conversieknop aan vóór de contractcontrole', async () => {
  const bron = await readFile(new URL('../tools/bouw-release-evidence.mjs', import.meta.url), 'utf8');
  const cta = bron.indexOf('await applyConversionCta()');
  assert.ok(cta > 0);
  assert.ok(cta < bron.indexOf('await finalizeSiteContracts()'));
});
