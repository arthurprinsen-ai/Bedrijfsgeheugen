import test from 'node:test';
import assert from 'node:assert/strict';
import {SEO_OPPORTUNITY_WEIGHTS,scoreSeoOpportunityEvidence} from '../tools/site-shell/seo-opportunity-evidence-model.mjs';
import {triageExternalSeoOpportunities} from '../tools/site-shell/seo-site-audit-intelligence.mjs';
const asOf='2026-11-12T15:00:00Z';
const owner='https://www.bedrijfsgeheugen.nl/afas-koppeling';
const afas={
 keyword:'afas koppeling',providerId:'dataforseo:11121511-2222-0607-0000-ab86d4f1717d',
 providerUpdatedAt:'2026-10-19T09:47:50Z',
 businessFit:0.97,fitEvidence:'Existing money page maps verified AFAS integration buyer intent',
 searchIntent:'informational',searchVolume:170,organicDifficulty:10,
 paidCompetition:0.56,cpc:4.12,yearlySearchTrendPercent:-89,
 gscImpressions:54,gscClicks:0,gscPosition:73.4,technicalErrorCount:0
};
test('priority score always has declared 100 point components and explicit uncertainty',()=>{
 assert.equal(Object.values(SEO_OPPORTUNITY_WEIGHTS).reduce((a,b)=>a+b,0),100);
 const r=scoreSeoOpportunityEvidence(afas,{canonicalOwner:owner,asOf});
 assert.equal(r.scoreVersion,'SEO_REVENUE_EVIDENCE_V2');
 assert.ok(r.score>0&&r.score<=100);
 assert.equal(r.action,'IMPROVE_EXISTING_CANONICAL_RELEVANCE_AND_INTERNAL_LINKS');
 assert.equal(r.diagnostics.organicDifficulty,10);
 assert.equal(r.diagnostics.paidAdsCompetition,0.56);
 assert.equal(r.diagnostics.gscClicks,0);
 assert.ok(r.boundaries.some(x=>x.includes('Paid ads competition')));
 assert.equal(r.diagnostics.aiVisibility,'REQUIRES_PROVIDER_CITATION_OR_HUMAN_REFERRER_EVIDENCE');
});
test('unobserved Search Console never becomes falsely observed zero-click traffic',()=>{
 const r=scoreSeoOpportunityEvidence({...afas,gscImpressions:undefined,gscClicks:undefined,gscPosition:undefined},
  {canonicalOwner:owner,asOf});
 assert.equal(r.diagnostics.gscImpressions,null);
 assert.equal(r.diagnostics.gscClicks,null);
 assert.ok(r.missingEvidence.includes('GSC_QUERY_PAGE_NOT_MEASURED'));
 assert.equal(r.action,'RECONCILE_GSC_QUERY_PAGE_AND_INTENT_FIRST');
});
test('high paid competition does not increase organic keyword difficulty and is not ROI',()=>{
 const first=scoreSeoOpportunityEvidence({...afas,organicDifficulty:undefined,paidCompetition:0},{canonicalOwner:owner,asOf});
 const second=scoreSeoOpportunityEvidence({...afas,organicDifficulty:undefined,paidCompetition:1},{canonicalOwner:owner,asOf});
 assert.equal(first.components.organicFeasibility,second.components.organicFeasibility);
 assert.equal(first.diagnostics.organicDifficulty,null);
 assert.ok(first.missingEvidence.includes('ORGANIC_KEYWORD_DIFFICULTY_NOT_MEASURED'));
 assert.equal(first.score,second.score);
});
test('third-party event without verifiable independent dated HTTPS source contributes no market proof',()=>{
 const base={...afas,yearlySearchTrendPercent:20};
 const invalid=scoreSeoOpportunityEvidence({...base,externalSignals:[
 {url:'http://example.com/blog',observedAt:'2026-11-12',independent:true},
 {url:'https://example.com/blog',observedAt:'2024-01-02',independent:true},
 {url:'https://example.org/rumor',observedAt:'2026-11-12',independent:false}
 ]},{canonicalOwner:owner,asOf});
 assert.equal(invalid.diagnostics.verifiedIndependentEvents.length,0);
 assert.ok(invalid.missingEvidence.includes('INDEPENDENT_EXTERNAL_EVENT_NOT_MEASURED'));
 const valid=scoreSeoOpportunityEvidence({...base,externalSignals:[
 {url:'https://ec.europa.eu/news',observedAt:'2026-11-11',independent:true},
 {url:'https://example.org/report',observedAt:'2026-11-10',independent:true}
 ]},{canonicalOwner:owner,asOf});
 assert.equal(valid.diagnostics.verifiedIndependentEvents.length,2);
 assert.ok(valid.components.verifiedMarketMovement>invalid.components.verifiedMarketMovement);
});
test('unrelated high-volume term cannot reach original website writer despite an exaggerated CPC',()=>{
 const result=triageExternalSeoOpportunities([
 {...afas,keyword:'online dobbelsteen',searchVolume:80000,cpc:99,businessFit:0.12},
 afas
 ],{asOf,intentOwners:{'afas koppeling':owner}});
 const irrelevant=result.find(x=>x.keyword==='online dobbelsteen');
 const legit=result.find(x=>x.keyword==='afas koppeling');
 assert.equal(irrelevant.score,null);
 assert.ok(irrelevant.reasons.includes('IRRELEVANT_OR_NONCOMMERCIAL'));
 assert.equal(legit.state,'READY_FOR_ORIGINAL_OWNER_REVIEW');
 assert.equal(legit.scoreVersion,'SEO_REVENUE_EVIDENCE_V2');
 assert.equal(legit.recommendedAction,'IMPROVE_EXISTING_CANONICAL_RELEVANCE_AND_INTERNAL_LINKS');
});
test('fresh provider-but-no-GSC, AI or sales never receives invented ROI, click or citation numbers',()=>{
 const r=triageExternalSeoOpportunities([{
 ...afas,keyword:'exact online koppeling',providerUpdatedAt:asOf,
 gscImpressions:undefined,gscClicks:undefined,gscPosition:undefined,
 aiSearchVolume:5
 }],{asOf,intentOwners:{'exact online koppeling':'https://www.bedrijfsgeheugen.nl/exact-online-koppeling'}})[0];
 assert.equal(r.gscImpressions,null);
 assert.equal(r.diagnostics.gscClicks,null);
 assert.equal(r.diagnostics.aiVisibility,'REQUIRES_PROVIDER_CITATION_OR_HUMAN_REFERRER_EVIDENCE');
 assert.equal(r.state,'READY_FOR_ORIGINAL_OWNER_REVIEW');
 assert.ok(!('visitors' in r)&&!('revenue' in r));
});
