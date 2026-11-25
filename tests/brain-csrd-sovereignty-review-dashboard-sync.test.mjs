import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_IMPACT_SNAPSHOT,withSovereigntyChangeReview,csrdImpactMarkup} from '../portal-v2/csrd-impact.js';
import './portal-csrd-sovereignty-review-link.test.mjs';

// Canonical Brain regression: the identical review is reflected in the existing
// CSRD & Impact page without declaring verified emissions or legal applicability.
test('Brain canonical cross-domain AI change review is displayed as pending CSRD/ESRS assessment',()=>{
 const v=withSovereigntyChangeReview(DEFAULT_IMPACT_SNAPSHOT,{
  snapshot:{reviewPortfolio:{contract:'powerhouse-review-portfolio-v1',status:'REVIEW_REQUIRED',
   tasks:[{domain:'csrd_esrs_scope',status:'NEEDS_EVIDENCE',candidateEsrs:['ESRS_E1','ESRS_G1']}]}}
 });
 assert.equal(v.sovereigntyChangeReview.materiality,'UNDETERMINED');
 assert.equal(v.sovereigntyChangeReview.measuredEmissions,null);
 assert.match(csrdImpactMarkup(v,{customerView:true}),/herbeoordeling nodig/);
});
