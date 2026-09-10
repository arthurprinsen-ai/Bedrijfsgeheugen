import test from 'node:test';
import assert from 'node:assert/strict';
import { eigenKnopAchtergrond, INHOUD_CSS } from '../tools/bouw-v18-chrome.mjs';
import { opDezePagina } from '../tools/v18-verrijking.mjs';

test('omlijnde knop van de pagina erft geen donkere achtergrond', () => {
  assert.equal(eigenKnopAchtergrond('.btn{border:2px solid #000;color:#111}'), '.btn{border:2px solid #000;color:#111;background:transparent}');
  assert.equal(eigenKnopAchtergrond('.knop.wit{color:blue}'), '.knop.wit{color:blue;background:transparent}');
});

test('knop met eigen achtergrond, hover of geen tekstkleur blijft ongemoeid', () => {
  for (const css of ['.btn.blauw{background:blue;color:#fff}', '.btn:hover{color:red}', '.btn{padding:4px}', '.knop-rij{color:#111}']) {
    assert.equal(eigenKnopAchtergrond(css), css);
  }
});

test('leesbreedte raakt alleen tekst direct in de inhoudskolom, niet de eigen secties', () => {
  assert.ok(!INHOUD_CSS.includes('.inhoud-body .wrap>*{max-width:72ch}'));
  assert.ok(INHOUD_CSS.includes('.inhoud-body>.wrap>:not(section){max-width:72ch}'));
  assert.ok(INHOUD_CSS.includes('.inhoud-body>.wrap>section{max-width:none'));
});

test('inhoudsopgave ontsnapt een bestaande entiteit niet nog eens', () => {
  const nav = opDezePagina([{ id: 'a', naam: 'Koppelingen &amp; automatisering' }, { id: 'b', naam: 'A & B' }, { id: 'c', naam: 'C' }]);
  assert.ok(nav.includes('Koppelingen &amp; automatisering'));
  assert.ok(!nav.includes('&amp;amp;'));
  assert.ok(nav.includes('A &amp; B'));
});
