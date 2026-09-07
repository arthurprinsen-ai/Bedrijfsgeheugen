import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const loader=fs.readFileSync('portal-next/portal-flow-state.js','utf8');
const css=fs.readFileSync('portal-next/portal-navigation-complete.css','utf8');
const js=fs.readFileSync('portal-next/portal-navigation-complete.js','utf8');

test('portal-next loads complete navigation layer',()=>{
  assert.match(loader,/portal-navigation-complete\.js/);
  assert.match(loader,/portal-navigation-complete\.css/);
});

test('mobile has a real hamburger drawer with full portal navigation',()=>{
  for(const token of ['mobileMenuToggle','portalMobileDrawer','portalMobileNav','data-portal-page']) assert.match(js,new RegExp(token));
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/\.portal-mobile-menu-toggle/);
  assert.match(css,/\.portal-mobile-drawer/);
});

test('all mapped portal pages are rendered as primary navigable pages',()=>{
  for(const id of ['profiel','data-ai','ai-scan','kansenkaart','gegevens-invullen','ingevulde-gegevens','businesscase','cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities','strategiemodellen','modellen','canvassen','eindconclusie','due-diligence','exit','strategie-naar-maandagochtend','actueel-houden','wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen','bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties','recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail','koppelingen','gebruikers','documenten','instellingen','audit']) assert.match(js,new RegExp(id));
});

test('new portal keeps evidence trace visible on native page views',()=>{
  for(const label of ['Managementbeeld','Operationele details','Trace & evidence','Bron','Datahub','AI Brain','Powerhouse','Actie','Outcome','Learning']) assert.match(js,new RegExp(label));
});

test('project-backed pages render natively without a visible legacy bridge',()=>{
  assert.match(js,/renderProjectPage/);
  assert.match(js,/PROJECT_PAGES/);
  assert.doesNotMatch(js,/native-legacy-frame/);
  assert.doesNotMatch(js,/\/klantportaal\.html/);
  assert.doesNotMatch(js,/data-legacy-tab/);
  assert.doesNotMatch(js,/styleLegacyDocument/);
  assert.doesNotMatch(css,/\.native-legacy-frame/);
});

test('approved overview remains the canonical dashboard instead of becoming a generic page',()=>{
  assert.match(js,/if\(id==='overzicht'\)\{showOverview\(\{historyMode\}\);return;\}/);
  assert.match(js,/Grip op je bedrijf\. Van context naar besluit, actie, bewijs en leren\./);
});
