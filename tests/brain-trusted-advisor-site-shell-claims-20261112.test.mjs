// Canonical ONE BRAIN replay entry point for the original site's existing shell tests.
// No second generator, scheduler, publisher or test framework.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRUST_BAR_HTML } from '../tools/site-shell/components.mjs';
import './site-shell-trustbar-css-only-repair.test.mjs';

test('trusted advisor original site-shell claim source never promises a universal implementation SLA',()=>{
 const canonical=readFileSync('over-ons.html','utf8');
 const gate=readFileSync('tools/controleer-site-ui.mjs','utf8');
 for(const value of ['Duidelijke afspraken vooraf','Klein beginnen, resultaat toetsen','Voor het Nederlandse mkb']){
  assert.ok(canonical.includes(value),value+' absent from canonical original page');
  assert.ok(TRUST_BAR_HTML.includes(value),value+' absent from generator');
  assert.ok(gate.includes(value),value+' absent from sitewide guard');
 }
 for(const value of ['In twee weken draaiend','Vaste prijs, geen uurtje-factuurtje']){
  assert.ok(!canonical.includes(value),value+' is still in canonical original page');
  assert.ok(!TRUST_BAR_HTML.includes(value),value+' is still in generated trustbar');
  assert.ok(!gate.includes(value),value+' is still required by sitewide guard');
 }
});
