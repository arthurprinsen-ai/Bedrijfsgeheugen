import test from 'node:test';
import assert from 'node:assert/strict';
import {mapRuntimeProjection} from '../portal-v2/runtime-evidence.js';
import {buildCompanyCockpit} from '../portal-v2/company-cockpit.js';
import {selectValueLeakage} from '../portal-v2/company-decisions.js';
import {renderCompanyCockpitHtml} from '../portal-v2/company-cockpit-ui.js';

test('missing Brain monetary source remains unknown throughout portal and HTML',()=>{
 const runtime=mapRuntimeProjection({decisionEconomics:undefined,executiveCockpit:{recommendedActions:[{title:'Verify cost'}]}});
 assert.equal(runtime.economics.expectedValue,null);
 assert.equal(runtime.economics.realizedValue,null);
 assert.equal(runtime.economics.actualCost,null);
 assert.equal(runtime.actions.items[0].waarde,null);
 assert.equal(selectValueLeakage(runtime),null);
 const sections=buildCompanyCockpit(runtime).sections;
 assert.equal(sections.find(x=>x.key==='economics').data.realizedProfit,null);
 assert.equal(sections.find(x=>x.key==='company-now').data.valueLeakage,null);
 const html=renderCompanyCockpitHtml(runtime);
 assert.match(html,/Gerealiseerde winst<\/small><b>—<\/b>/);
 assert.doesNotMatch(html,/€\s*0/);
});

test('false, whitespace and arrays cannot be mistaken for measured financial zero',()=>{
 for(const value of [false,true,'   ',[],{},'not a number']){
  const runtime=mapRuntimeProjection({decisionEconomics:{expectedValue:value,realizedValue:0}});
  assert.equal(runtime.economics.expectedValue,null);
  assert.equal(selectValueLeakage(runtime),null);
 }
});

test('explicit 0 is measurable but invalid and missing source data stay null',()=>{
 const runtime=mapRuntimeProjection({
  decisionEconomics:{expectedValue:'0',realizedValue:0,actualCost:'',realizedProfit:null},
  verifiedValue:{verifiedValues:[
   {subjectId:'no-money',status:'OPEN',amount:null},
   {subjectId:'zero-money',status:'VERIFIED',value:0}
  ]}
 });
 assert.equal(runtime.economics.expectedValue,0);
 assert.equal(runtime.economics.realizedValue,0);
 assert.equal(runtime.economics.actualCost,null);
 assert.equal(runtime.economics.realizedProfit,null);
 assert.equal(selectValueLeakage(runtime),0);
 assert.deepEqual(runtime.outcomes.items.map(x=>x.waarde),[null,0]);
});
