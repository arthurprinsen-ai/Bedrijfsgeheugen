import test from 'node:test';
import assert from 'node:assert/strict';
import {createScenario,simulateScenario,compareScenarios} from '../portal-v2/operating-system/scenario-engine.js';
import {renderCompanyCockpitHtml} from '../portal-v2/company-cockpit-ui.js';

test('unknown scenario baselines never become fictional zero revenue or zero confidence',()=>{
 const scenario=createScenario({baselineRef:'customer-1',assumptions:{revenue_pct:15,capacity_pct:10,risk_delta:5}});
 const result=simulateScenario({kpis:{revenue:null,capacity:'',risk:undefined},confidence:null},scenario);
 assert.equal(result.kpis.revenue,null);
 assert.equal(result.kpis.capacity,'');
 assert.equal(result.kpis.risk,undefined);
 assert.equal(result.confidence,null);
 assert.deepEqual(compareScenarios({kpis:{revenue:null,capacity:''}},{kpis:{revenue:100,capacity:20}}).kpi_delta,{});
});

test('measured numeric zero remains a valid baseline and numeric strings are supported',()=>{
 const scenario=createScenario({baselineRef:'customer-2',assumptions:{revenue_pct:'10',capacity_pct:'-20',risk_delta:'2'}});
 const result=simulateScenario({kpis:{revenue:0,capacity:'10',risk:5},confidence:.8},scenario);
 assert.deepEqual(result.kpis,{revenue:0,capacity:8,risk:7});
 assert.equal(result.confidence,.8);
 assert.deepEqual(compareScenarios({kpis:{revenue:0}},{kpis:{revenue:20}}).kpi_delta,{revenue:20});
});

test('the canonical V2 cockpit shows at most three top decisions and keeps the rest accessible',()=>{
 const decisions=Array.from({length:5},(_,index)=>({
  id:'decision-'+index,title:'Actie '+(index+1),portfolioBucket:'NOW',
  rank:index+1,status:'ELIGIBLE',expectedValue:null,confidence:null
 }));
 const html=renderCompanyCockpitHtml({
  decisions:{items:decisions},
  economics:{expectedValue:null,actualCost:null,realizedValue:null,realizedProfit:null,currency:'EUR'}
 });
 const summaryMarker='<summary>Overige prioriteiten (2)</summary>';
 assert.ok(html.includes(summaryMarker));
 const top=html.split(summaryMarker)[0];
 const other=html.split(summaryMarker)[1];
 assert.equal((top.match(/class="company-decision-card"/g)||[]).length,3);
 assert.equal((other.match(/class="company-decision-card"/g)||[]).length,2);
 assert.match(html,/aria-label="Drie belangrijkste prioriteiten"/);
 assert.match(html,/<small>Vertrouwen<\/small><b>—<\/b>/);
 assert.match(html,/<small>Verwachte waarde<\/small><b>—<\/b>/);
});
