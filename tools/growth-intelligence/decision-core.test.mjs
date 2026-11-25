import test from "node:test";
import assert from "node:assert/strict";
import {runGrowthDecisionCycle,decideExecution,evaluateExperiment} from "./decision-core.mjs";
const base={id:"signal-1",type:"scan_abandonment",source:"ga4:scan-funnel",observedAt:Date.now(),estimatedIncrementalMargin:2900,confidence:.7,dataQuality:.9,effortHours:3,risk:.1};
test("prioritizes valid opportunity with evidence",()=>{
 const result=runGrowthDecisionCycle([base]);
 assert.equal(result.proposals.length,1);
 assert.equal(result.proposals[0].agent,"cro");
 assert.ok(result.proposals[0].score>0);
});
test("rejects unconsented personal data and duplicate signals",()=>{
 const result=runGrowthDecisionCycle([base,base,{...base,id:"s2",containsPersonalData:true}]);
 assert.equal(result.rejected.length,2);
});
test("prevents unapproved deployment and unverified order",()=>{
 const p=runGrowthDecisionCycle([base]).proposals[0];
 assert.equal(decideExecution(p,"deploy_code",{approved:true}).allowed,false);
 assert.equal(decideExecution(p,"record_revenue",{paymentProviderVerified:true}).allowed,false);
 assert.equal(decideExecution(p,"record_revenue",{paymentProviderVerified:true,paymentReference:"stripe_123"}).allowed,true);
});
test("avoids outreach without lawful contact basis",()=>{
 const p=runGrowthDecisionCycle([{...base,type:"warm_connection"}]).proposals[0];
 assert.equal(decideExecution(p,"send_message",{approved:true}).reason,"CONTACT_BASIS_REQUIRED");
});
test("experiment guards avoid false wins",()=>{
 const e={id:"a",primaryMetric:"qualified_leads_to_paid_orders",preRegistered:true,pValue:.01,effect:.1,sampleSize:500,minimumSampleSize:200};
 assert.equal(evaluateExperiment({...e,sampleRatioMismatch:true}).status,"INVALID");
 assert.equal(evaluateExperiment({...e,sampleSize:3}).status,"INCONCLUSIVE");
 assert.equal(evaluateExperiment(e).status,"WIN");
});
