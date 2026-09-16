import test from 'node:test';
import assert from 'node:assert/strict';
import {IMPACT_FORMULA_VERSION,normalizeImpact,calculatePaybackMonths,rankImpact} from '../portal-v2/operating-system/impact-engine.js';

test('impact preserves explicit value kinds and confidence',()=>{
 const out=normalizeImpact({revenue_upside:{kind:'estimated',amount:100000},required_investment:{kind:'observed',amount:20000},confidence:1.4});
 assert.equal(out.revenue_upside.kind,'estimated');
 assert.equal(out.required_investment.kind,'observed');
 assert.equal(out.confidence,1);
 assert.equal(out.formula_version,IMPACT_FORMULA_VERSION);
});

test('payback is derived from recurring monthly benefit only',()=>{
 assert.equal(calculatePaybackMonths({required_investment:12000,annual_benefit:24000}),6);
 assert.equal(calculatePaybackMonths({required_investment:0,annual_benefit:24000}),0);
 assert.equal(calculatePaybackMonths({required_investment:12000,annual_benefit:0}),null);
});

test('ranking is inspectable and versioned',()=>{
 const ranked=rankImpact({impact:80,urgency:70,strategic_fit:90,confidence:.8,effort:40,reversibility:70,dependency_risk:20,time_to_value:80});
 assert.equal(ranked.version,IMPACT_FORMULA_VERSION);
 assert.ok(ranked.score>0&&ranked.score<=100);
 assert.equal(Object.keys(ranked.components).length,8);
});
