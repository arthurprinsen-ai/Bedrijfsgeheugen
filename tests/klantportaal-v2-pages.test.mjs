import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_PAGE_INDEX, listPortalGroups, allPageIds } from '../portal-v2/page-registry.js';

const mustKeep=['overzicht','profiel','data-ai','ai-scan','kansenkaart','gegevens-invullen','ingevulde-gegevens','businesscase','cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities','strategiemodellen','modellen','canvassen','eindconclusie','due-diligence','exit','advies','offerte','roadmap','strategie-naar-maandagochtend','uitvoeringsladder','taken-werkstromen','actueel-houden','wijzigingen','koppelingen','gebruikers','documenten','instellingen','audit'];

test('v2 registry exposeert alle bestaande pagina-identiteiten',()=>{
  const ids=new Set(allPageIds());
  for(const id of mustKeep) assert.ok(ids.has(id),`missing ${id}`);
  const flattened=listPortalGroups().flatMap(g=>g.pages.map(p=>p.id));
  for(const id of Object.keys(PORTAL_PAGE_INDEX)) assert.ok(flattened.includes(id),`not exposed ${id}`);
});

/**
 * De oude test importeerde hier `buildLegacyUrl` en toetste of de v2-registry een
 * deeplink naar /klantportaal kon bouwen. Dat is bewust vervallen: Portal V2 is
 * standalone en portal-v2-standalone-contract.test.mjs verbiedt dat export
 * expliciet (`assert.doesNotMatch(source, /buildLegacyUrl/)`). De twee tests
 * spraken elkaar tegen; het standalone-contract is de geldende afspraak.
 */
test('v2 registry bouwt geen deeplinks terug naar het oude portaal',()=>{
  const source=JSON.stringify(PORTAL_PAGE_INDEX);
  assert.doesNotMatch(source,/klantportaal/i);
  assert.doesNotMatch(source,/portal-next/i);
});
