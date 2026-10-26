import test from 'node:test';
import assert from 'node:assert/strict';
import { runGrowthDecisionCycle } from '../tools/growth-intelligence/decision-core.mjs';
import { heartbeatGrowthTick } from '../tools/growth-intelligence/heartbeat-adapter.mjs';

test('historical replay: classify verified growth signal without autonomous publication',()=>{
 const now=Date.UTC(2026,9,25);
 const signal={id:'replay-scan',type:'scan_abandonment',observedAt:now,estimatedIncrementalMargin:2900,confidence:.8,dataQuality:.9,effortHours:3,risk:.1};
 const output=heartbeatGrowthTick({cycleId:'replay',events:[{provider:'ga4',verified:false,evidenceId:'unverified',signal}]},{now});
 assert.equal(output.opportunities.length,0);
 assert.equal(output.publishReady,false);
 assert.equal(output.revenueVerified,false);
});
