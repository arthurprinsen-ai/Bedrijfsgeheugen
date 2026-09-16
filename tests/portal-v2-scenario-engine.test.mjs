import test from 'node:test';
import assert from 'node:assert/strict';
import {createScenario,simulateScenario,compareScenarios} from '../portal-v2/operating-system/scenario-engine.js';

test('scenario creation is immutable and simulation never mutates baseline',()=>{
 const baseline={kpis:{revenue:100,capacity:10,risk:30}};const before=JSON.stringify(baseline);
 const scenario=createScenario({baselineRef:'base-1',assumptions:{revenue_pct:15,capacity_pct:-10,risk_delta:5},horizon:'12m',modelVersion:'scenario-v1'});
 const result=simulateScenario(baseline,scenario);
 assert.equal(JSON.stringify(baseline),before);assert.equal(result.kpis.revenue,115);assert.equal(result.kpis.capacity,9);assert.equal(result.kpis.risk,35);assert.ok(Object.isFrozen(scenario));
});

test('scenario comparison returns explicit deltas',()=>{
 const a={kpis:{revenue:100,capacity:10,risk:20}},b={kpis:{revenue:120,capacity:8,risk:25}};
 assert.deepEqual(compareScenarios(a,b).kpi_delta,{revenue:20,capacity:-2,risk:5});
});
