import test from 'node:test';
import assert from 'node:assert/strict';
import {CSRD_ESRS_OFFICIAL_SOURCES,screenCsrdEsrsScope} from '../portal-v2/csrd-legal-source-gate.js';
import {regulatoryContextTrace} from '../portal-v2/regulatory-context-trace.js';

test('P0 4215 official post-2026 CSRD/ESRS law references are explicit and unique',()=>{
  assert.deepEqual(CSRD_ESRS_OFFICIAL_SOURCES.map(s=>s.id),[
    'DIRECTIVE_EU_2026_470','DELEGATED_REGULATION_EU_2026_1563'
  ]);
  assert.ok(CSRD_ESRS_OFFICIAL_SOURCES.every(s=>s.url.startsWith('https://eur-lex.europa.eu/')));
});

test('P0 4215 threshold screening is conditional on the financial reporting year',()=>{
  const base={averageEmployees:1100,netTurnoverEur:500000000,entityScope:'single',memberState:'NL'};
  assert.equal(screenCsrdEsrsScope({...base,financialYearStart:'2026-01-01'}).thresholdScreen,'PERIOD_REVIEW_REQUIRED');
  assert.equal(screenCsrdEsrsScope({...base,financialYearStart:'2027-01-01'}).thresholdScreen,'ABOVE_BOTH_THRESHOLDS');
  assert.equal(screenCsrdEsrsScope({...base,financialYearStart:'2027-01-01',averageEmployees:1000}).thresholdScreen,'NOT_ABOVE_BOTH_THRESHOLDS');
  assert.equal(screenCsrdEsrsScope({...base,financialYearStart:'2027-01-01',netTurnoverEur:450000000}).thresholdScreen,'NOT_ABOVE_BOTH_THRESHOLDS');
  assert.equal(screenCsrdEsrsScope({...base,financialYearStart:'2027-01-01',averageEmployees:null}).thresholdScreen,'INSUFFICIENT_ENTITY_DATA');
  assert.equal(screenCsrdEsrsScope({...base,financialYearStart:'2027-02-30'}).thresholdScreen,'PERIOD_REVIEW_REQUIRED');
});

test('P0 4215 no value, source, or apparent threshold match can fabricate legal customer scope',()=>{
  for(const payload of [
    {},
    {financialYearStart:'2027-01-01',averageEmployees:1400,netTurnoverEur:990000000,entityScope:'consolidated_parent',memberState:'NL'},
    {financialYearStart:'2027-01-01',averageEmployees:50,netTurnoverEur:1000000,entityScope:'single',memberState:'NL',nationalImplementationEvidence:'test',legalReviewEvidence:'test',esrsMaterialityEvidence:'test'}
  ]){
    const review=screenCsrdEsrsScope(payload);
    assert.equal(review.legalStatus,'REVIEW_REQUIRED');
    assert.equal(review.csrdApplicability,'UNDETERMINED');
    assert.equal(review.esrsReportingObligation,'UNDETERMINED');
    assert.equal(review.financialImpactEur,null);
    assert.equal(review.measuredEmissions,null);
    assert.ok(review.officialSources.length>=2);
  }
});

test('P0 4215 CSRD impact links to authoritative legal basis; non-CSRD impacts do not',()=>{
  const event={framework:'CSRD',financialYearStart:'2027-01-01',averageEmployees:1001,
    netTurnoverEur:450000001,entityScope:'single',memberState:'NL',sourceUrl:'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026L0470'};
  const review=regulatoryContextTrace(event);
  assert.equal(review.legalBasis.thresholdScreen,'ABOVE_BOTH_THRESHOLDS');
  assert.equal(review.legalStatus,'REVIEW_REQUIRED');
  assert.equal(review.financialStatus,'NOT_QUANTIFIED');
  assert.equal(review.legalBasis.csrdApplicability,'UNDETERMINED');
  assert.ok(review.affectedPages.includes('csrd-impact'));
  assert.ok(review.affectedPages.includes('roadmap'));
  assert.equal('legalBasis' in regulatoryContextTrace({framework:'GDPR'}),false);
});
