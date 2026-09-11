import test from 'node:test';
import assert from 'node:assert/strict';
import { metLettertypeTerugval, metTerugvalStapel, terugvalCss, LETTERTYPEN } from '../tools/site-shell/lettertype-terugval.mjs';

// Fontwissel zonder verspringen (11 sept 2026): /zelfscan CLS 0,109 en /ai-scan
// 0,174 op telefoons, weg met Google Fonts geblokkeerd. font-display: swap blijft;
// de terugval krijgt de maten van het echte lettertype.

test('elke stapel met Instrument Sans of Bricolage krijgt de twee maatgelijke terugvallers', () => {
  assert.equal(metTerugvalStapel('font-family:"Instrument Sans",system-ui,sans-serif'),
    'font-family:"Instrument Sans","Instrument Sans Fallback","Instrument Sans Fallback Roboto",system-ui,sans-serif');
  assert.equal(metTerugvalStapel("font:700 2rem/1.1 'Bricolage Grotesque',system-ui"),
    "font:700 2rem/1.1 'Bricolage Grotesque','Bricolage Grotesque Fallback','Bricolage Grotesque Fallback Roboto',system-ui");
  assert.match(metTerugvalStapel('font-family:Instrument Sans,system-ui'), /Instrument Sans,"Instrument Sans Fallback"/);
  assert.equal(metTerugvalStapel('font-family:Georgia,serif'), 'font-family:Georgia,serif');
});

test('idempotent: een tweede keer verandert niets', () => {
  const html = '<html><head><style>body{font-family:"Instrument Sans",system-ui}</style></head><body><p style="font-family:&quot;Bricolage Grotesque&quot;">x</p></body></html>';
  const een = metLettertypeTerugval(html);
  assert.equal(metLettertypeTerugval(een), een);
  assert.equal(een.match(/id="bg-lettertype-terugval"/g).length, 1);
  assert.match(een, /style="font-family:&quot;Bricolage Grotesque&quot;,&quot;Bricolage Grotesque Fallback&quot;/);
});

test('de terugval gebruikt lokale lettertypen met maatcorrectie, en swap blijft', () => {
  const css = terugvalCss();
  for (const familie of Object.keys(LETTERTYPEN)) {
    assert.match(css, new RegExp(`font-family:"${familie} Fallback";src:local\\("Arial"\\)`));
    assert.match(css, new RegExp(`font-family:"${familie} Fallback Roboto";src:local\\("Roboto"\\)`));
  }
  assert.match(css, /size-adjust:101\.79%;ascent-override:95\.29%/);
  assert.doesNotMatch(css, /url\(/, 'geen extra downloads');
  assert.doesNotMatch(css, /font-display/, 'de weergaveregel van Google Fonts (swap) blijft ongemoeid');
});
