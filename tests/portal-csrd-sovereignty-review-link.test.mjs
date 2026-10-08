import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_IMPACT_SNAPSHOT,csrdImpactMarkup,withSovereigntyChangeReview} from '../portal-v2/csrd-impact.js';

const portfolio={snapshot:{reviewPortfolio:{
 contract:'powerhouse-review-portfolio-v1',status:'REVIEW_REQUIRED',changeKind:'AI_MODEL',
 tasks:[{domain:'privacy',status:'NEEDS_EVIDENCE'},
  {domain:'csrd_esrs_scope',status:'NEEDS_EVIDENCE',candidateEsrs:['ESRS_E1','ESRS_G1','<img onerror=alert(1)>']}]
}}};

test('CSRD page presents the same tenant-authorized pending AI review without fabricated legal or environmental claims',()=>{
 const base=structuredClone(DEFAULT_IMPACT_SNAPSHOT);
 const view=withSovereigntyChangeReview(base,portfolio);
 assert.equal(view.sovereigntyChangeReview.status,'REVIEW_REQUIRED');
 assert.equal(view.sovereigntyChangeReview.applicability,'UNDETERMINED');
 assert.equal(view.sovereigntyChangeReview.materiality,'UNDETERMINED');
 assert.equal(view.sovereigntyChangeReview.measuredEmissions,null);
 assert.deepEqual(view.sovereigntyChangeReview.candidateEsrs,['ESRS_E1','ESRS_G1']);
 const markup=csrdImpactMarkup(view,{customerView:true});
 assert.match(markup,/Openstaande CSRD-herbeoordeling/);
 assert.match(markup,/CSRD\/ESRS-toepasselijkheid en materialiteit zijn nog niet vastgesteld/);
 assert.match(markup,/ESRS_E1, ESRS_G1/);
 assert.doesNotMatch(markup,/onerror|img onerror/);
 assert.equal(Object.hasOwn(base,'sovereigntyChangeReview'),false);
});

test('missing or unproven sovereignty readback never invents review or approval',()=>{
 for(const readback of [null,{}, {snapshot:{reviewPortfolio:{contract:'powerhouse-review-portfolio-v1',status:'NO_REVIEW',tasks:[]}}}]){
  const v=withSovereigntyChangeReview(DEFAULT_IMPACT_SNAPSHOT,readback);
  assert.equal(Object.hasOwn(v,'sovereigntyChangeReview'),false);
  assert.doesNotMatch(csrdImpactMarkup(v,{customerView:true}),/Openstaande CSRD-herbeoordeling/);
 }
});

test('the canonical CSRD page reads from the customer-bound sovereignty endpoint only',async()=>{
 const source=await readFile(new URL('../portal-v2/page-shell.js',import.meta.url),'utf8');
 assert.match(source,/withSovereigntyChangeReview/);
 assert.match(source,/fetch\('\/api\/data-sovereignty',\{credentials:'same-origin',cache:'no-store'/);
 assert.match(source,/root\.dataset\.pageId!=='csrd-impact'/);
 assert.doesNotMatch(source,/fetch\('\/api\/data-sovereignty\?scope=bedrijfsgeheugen'/);
});
