import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildAutonomousInnovationPortfolio,INNOVATION_CONTRACT}
  from '../brain/self-improvement/autonomous-innovation-portfolio.mjs';
import {projectCompoundImprovementProof} from '../netlify/functions/_powerhouse-compound-improvement-proof.mjs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const at='2026-10-30T12:00:00.000Z';
const state={learningReadiness:'LIVE',revenueFlywheel:'LIVE',runtimeHealth:'LIVE',
  socialApplications:'LIVE',revenueApplications:'LIVE',behavior:'LIVE',conversionProof:'LIVE'};
const x={
 at,readStates:state,
 learningReadiness:[{observed_at:'2026-10-30T11:59:00Z',open_obligations:501,overdue_obligations:20,
    missing_outcome_evidence:5,missing_economics_evidence:15,missing_feedback_evidence:481,
    overdue_system_obligations:20}],
 revenueFlywheel:[{measured_at:'2026-10-30T11:59:00Z',open_opportunities:938,
    executed_actions:483,revenue_outcomes:0,due_uncalibrated_forecasts:1867,
    pending_external_outcomes:5,realized_revenue_eur:'0'}],
 runtimeHealth:[{observed_at:'2026-10-30T11:59:00Z',total_layers:32,wired_layers:32,
    required_jobs:18,active_jobs:18,current_runtime_errors:2,
    evidence_sparse_required_layers:2,architecture_state:'AMBER'}],
 socialApplications:[],revenueApplications:[],portalBehavior:[],
 croConversionEvidence:[{evaluated_at:'2026-10-30T11:59:00Z',
    human_flagged_pageviews_7d:4444,observed_cta_events_7d:0,
    recorded_leads_30d:0}]
};
test('real historic data yields 6 self-invented but unexecuted and evidence-bound innovations',()=>{
 const r=projectCompoundImprovementProof(x), p=r.innovationPortfolio;
 assert.equal(p.contract,INNOVATION_CONTRACT);
 assert.equal(p.innovationCandidates.length,6);
 assert.equal(p.innovationCandidates[0].id,'consented-conversion-recovery');
 const cro=p.innovationCandidates.find(v=>v.id==='consented-conversion-recovery');
 assert.equal(cro.stage,'BOUNDED_OWNER_BUILD_CANDIDATE');
 assert.equal(cro.evidence[0].value,4444);
 assert.equal(cro.evidence[1].value,0);
 assert.equal(cro.automaticPromotionAuthorized,false);
 assert.equal(cro.customerOrPaidOutcomeProven,false);
 const learning=p.innovationCandidates.find(v=>v.id==='next-natural-agent-learning');
 assert.equal(learning.evidence[0].value,0);
 assert.equal(learning.evidence[1].value,0);
 const portal=p.innovationCandidates.find(v=>v.id==='customer-action-copilot');
 assert.equal(portal.reason,'CUSTOMER_VALUE_AND_ACTUAL_TASK_EVIDENCE_DUE');
 assert.equal(portal.evidence[0].value,0);
 assert.equal(p.executionContract.noSecondScheduler,true);
 assert.equal(p.executionContract.exclusiveWriterRequired,true);
 assert.equal(p.executionContract.releaseAndUpliftVerified,false);
 assert.equal(r.guarantees.newScheduledExecutors,0);
});

test('without canonical source or consented CTA coverage, decline build-ready claims',()=>{
 const r=projectCompoundImprovementProof({...x,readStates:{...state,conversionProof:'TRUNCATED',
   revenueFlywheel:'UNAVAILABLE',socialApplications:'UNAVAILABLE',behavior:'UNAVAILABLE'}});
 const arr=r.innovationPortfolio.innovationCandidates;
 assert.equal(arr.find(v=>v.id==='consented-conversion-recovery').stage,'MEASUREMENT_OR_SOURCE_REPAIR');
 assert.equal(arr.find(v=>v.id==='next-natural-agent-learning').stage,'MEASUREMENT_OR_SOURCE_REPAIR');
 assert.equal(arr.find(v=>v.id==='evidence-backed-buyer-problem-discovery').stage,'MEASUREMENT_OR_SOURCE_REPAIR');
 assert.equal(arr.find(v=>v.id==='customer-action-copilot').stage,'MEASUREMENT_OR_SOURCE_REPAIR');
 assert.equal(r.status,'PARTIAL_SOURCE_READBACK');
 assert.equal(arr.every(v=>v.automaticPromotionAuthorized===false),true);
});

test('portfolio is deterministic for an original evidence window and never leaks client details',()=>{
 const r=projectCompoundImprovementProof({...x,
  portalBehavior:[{pad:'/portal-v2/company-secret@example.com',page_events:8,
    persisted_event_receipts:8,form_starts:3,form_errors:1,form_abandons:2,
    last_observed_at:'2026-10-30T11:00:00Z'}]});
 const a=buildAutonomousInnovationPortfolio({proof:r,
  cro:{humanFlaggedPageviews7d:4444,observedCtaEvents7d:0,recordedLeads30d:0},at});
 const b=buildAutonomousInnovationPortfolio({proof:r,
  cro:{humanFlaggedPageviews7d:4444,observedCtaEvents7d:0,recordedLeads30d:0},at});
 assert.deepEqual(a,b);
 assert.ok(!JSON.stringify(a).includes('secret@example.com'));
 assert.equal(a.innovationCandidates.find(v=>v.id==='adaptive-portal-ux').evidence[0].value,1);
 assert.equal(a.innovationCandidates.find(v=>v.id==='customer-action-copilot').evidence[0].value,8);
 assert.equal(a.innovationCandidates.every(v=>v.permission==='ORIGINAL_AGENT_MAY_BUILD_PROTECTED_CANDIDATE_ONLY'),true);
});

test('invalid timestamps and unverified metrics cannot turn into paying orders or live deployments',()=>{
 const bad=buildAutonomousInnovationPortfolio({proof:projectCompoundImprovementProof(x),cro:{humanFlaggedPageviews7d:Infinity},at:'not-a-date'});
 assert.equal(bad.status,'UNVERIFIED');
 assert.ok(bad.innovationCandidates.every(v=>v.stage==='MEASUREMENT_OR_SOURCE_REPAIR'));
 assert.ok(bad.innovationCandidates.every(v=>v.customerOrPaidOutcomeProven===false));
 const defaultProjection=projectOtherData({at,readStates:{},daily:[],behavior:[]});
 assert.equal(defaultProjection.compoundImprovement.innovationPortfolio.innovationCandidates.length,6);
 assert.ok(defaultProjection.quality.flags.includes('COMPOUND_IMPROVEMENT_SOURCE_READBACK_INCOMPLETE'));
});

test('one owner-only existing source, original skill compiler and visible portal; no new writer, scheduler or model promotion',()=>{
 const engine=readFileSync('brain/self-improvement/autonomous-innovation-portfolio.mjs','utf8');
 const original=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const portal=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const skill=readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md','utf8');
 const agents=readFileSync('AGENTS.md','utf8');
 assert.match(original,/isPowerhouseAdmin\(user/);
 assert.match(original,/croConversionEvidence:conversionProof/);
 assert.match(portal,/data-powerhouse-autonomous-innovation/);
 assert.match(skill,/POWERHOUSE_AGENT_AUTONOMOUS_INNOVATION_V1/);
 assert.match(agents,/POWERHOUSE_AGENT_AUTONOMOUS_INNOVATION_V1/);
 assert.doesNotMatch(engine,/Netlify\.env|fetch\(|INSERT INTO|setInterval|cron\.schedule|executeSql/);
 assert.equal((portal.match(/data-powerhouse-autonomous-innovation/g)||[]).length,1);
});
