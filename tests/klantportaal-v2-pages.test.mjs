import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_PAGE_INDEX, listPortalGroups, buildLegacyUrl, allPageIds } from '../portal-v2/page-registry.js';

const mustKeep=['overzicht','profiel','data-ai','ai-scan','kansenkaart','gegevens-invullen','ingevulde-gegevens','businesscase','cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities','strategiemodellen','modellen','canvassen','eindconclusie','due-diligence','exit','advies','offerte','roadmap','strategie-naar-maandagochtend','uitvoeringsladder','taken-werkstromen','actueel-houden','wijzigingen','koppelingen','gebruikers','documenten','instellingen','audit'];

test('v2 registry exposeert alle bestaande pagina-identiteiten',()=>{
  const ids=new Set(allPageIds());
  for(const id of mustKeep) assert.ok(ids.has(id),`missing ${id}`);
  const flattened=listPortalGroups().flatMap(g=>g.pages.map(p=>p.id));
  for(const id of Object.keys(PORTAL_PAGE_INDEX)) assert.ok(flattened.includes(id),`not exposed ${id}`);
});

test('legacy url behoudt klantcontext en tab',()=>{
  const url=new URL(buildLegacyUrl('profiel','ijsselmonde'));
  assert.equal(url.searchParams.get('klant'),'ijsselmonde');
  assert.equal(url.searchParams.get('tab'),'profiel');
});
