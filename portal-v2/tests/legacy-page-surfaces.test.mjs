import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_PAGE_HEADINGS, buildLegacyPageSurfaces } from '../modules/legacy-page-surfaces.js';

const generated=['data-ai','ai-scan','businesscase','mensen','branche-markt','strategie-naar-maandagochtend','waarde-financiering','onderzoek','compliance-governance','cijfers-maatstaven','eindconclusie','actueel-houden','advies','roadmap','due-diligence'];

test('native V2 analysis restores every protected legacy heading for generated workspaces',()=>{
  for(const pageId of generated){
    const actual=buildLegacyPageSurfaces(pageId,{}).map(x=>x.title);
    const expected=LEGACY_PAGE_HEADINGS[pageId];
    assert.deepEqual(actual,expected,pageId+' heading drift');
  }
});

test('legacy analysis surfaces fail closed instead of inventing customer values',()=>{
  for(const pageId of generated){
    const serialized=JSON.stringify(buildLegacyPageSurfaces(pageId,{}));
    assert.doesNotMatch(serialized,/€\s*[1-9][0-9.]*|\b[1-9][0-9]{2,}\s*%/);
  }
});

test('protected legacy heading registry contains all source-derived workspaces',()=>{
  for(const pageId of ['data-ai','ai-scan','profiel','mensen','gegevens-invullen','businesscase','waarde-financiering','onderzoek','compliance-governance','strategie-naar-maandagochtend','cijfers-maatstaven','branche-markt','eindconclusie','actueel-houden','advies','uitvoeringsladder','roadmap','due-diligence']){
    assert.ok(Array.isArray(LEGACY_PAGE_HEADINGS[pageId])&&LEGACY_PAGE_HEADINGS[pageId].length>0,pageId);
  }
});
