import test from 'node:test';
import assert from 'node:assert/strict';
import { impactForMutation, PORTAL_IMPACT_ENGINE_VERSION } from '../portal-v2/portal-impact-engine.js';

const base={
  portal:{
    profile:{employees:24,hourlyCost:50,maturity:{sturing:1,commercie:2,operatie:2,finance:2,mensen:2,analytics:2,quality:2,governance:2,tech:2,culture:2,service:2,security:2,duurzaam:2}},
    businessCase:{target:4,investment:10000,delay:3},
    metrics:{revenue:1000000,ebitda:120000,grossMargin:40,dso:30},
    valueFinance:{multiple:5,debt:100000,cash:50000,balance:800000,equity:400000,wacc:10,interest:12000,fixed:300000},
    roadmap:{items:[]},advice:{items:[]}
  }
};
const clone=x=>structuredClone(x);

test('maturity change propagates to all causally dependent portal surfaces',()=>{
  const after=clone(base);after.portal.profile.maturity.sturing=4;
  const impact=impactForMutation({path:'portal.profile.maturity.sturing',before:base,after});
  assert.equal(PORTAL_IMACT_ENGINE_VERSION_SAFE(), '2026-09-18-v2-organism-causal');
  for(const page of ['profiel','overzicht','businesscase','data-ai','onderzoek','advies','roadmap']) assert.ok(impact.affectedPages.includes(page),page);
  for(const calc of ['manual-work-annual','dimension-cost-total','dimension-potential-total','fte-lost','benefit-at-target-maturity']) assert.ok(impact.changes.some(x=>x.id===calc),calc);
  assert.ok(impact.effectRules.some(x=>x.kind==='maturity'));
  assert.ok(impact.effectDetails.some(x=>x.page==='businesscase'&&x.viaCalculation.length));
});

test('financial change reaches valuation, due diligence, businesscase and executive cockpit',()=>{
  const after=clone(base);after.portal.metrics.ebitda=180000;
  const impact=impactForMutation({path:'portal.metrics.ebitda',before:base,after});
  for(const page of ['cijfers-maatstaven','waarde-financiering','businesscase','due-diligence','overzicht','advies']) assert.ok(impact.affectedPages.includes(page),page);
  for(const calc of ['ebitda-margin','enterprise-value','equity-value','dcf']) assert.ok(impact.changes.some(x=>x.id===calc),calc);
  assert.ok(impact.effectRules.some(x=>x.kind==='finance'));
});

function PORTAL_IMACT_ENGINE_VERSION_SAFE(){return PORTAL_IMPACT_ENGINE_VERSION;}
