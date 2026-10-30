import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_AGENT_TEAM} from '../platform/agents/agent-team.mjs';
import {buildAutonomousInnovationPortfolio} from '../brain/self-improvement/autonomous-innovation-portfolio.mjs';
import {buildAllAgentInnovationDuties,ALL_AGENT_INNOVATION_DUTY_CONTRACT}
  from '../brain/self-improvement/all-agent-innovation-duties.mjs';
import {buildDailySelfEvolutionSnapshot} from '../scripts/brain/daily-self-evolution.mjs';
import {projectCompoundImprovementProof} from '../netlify/functions/_powerhouse-compound-improvement-proof.mjs';
const at='2026-10-30T12:30:00Z';
const portfolio=buildAutonomousInnovationPortfolio({at});

test('all original and future registered agents get a safe innovation role, never fictitious execution',()=>{
 const r=buildAllAgentInnovationDuties({agents:DEFAULT_AGENT_TEAM,innovationPortfolio:portfolio,at});
 assert.equal(r.contract,ALL_AGENT_INNOVATION_DUTY_CONTRACT);
 assert.equal(r.status,'ROSTER_COVERED_APPLICATION_EVIDENCE_DUE');
 assert.equal(r.assignedCount,DEFAULT_AGENT_TEAM.length);
 assert.equal(r.agentCount,DEFAULT_AGENT_TEAM.length);
 assert.deepEqual(r.uncoveredAgentIds,[]);
 assert.equal(r.assignments.filter(x=>x.executionState==='ASSIGNED_NOT_EXECUTED').length,DEFAULT_AGENT_TEAM.length);
 assert.equal(r.assignments.every(x=>x.actualApplicationId===null&&x.exactProductionSha===null&&x.verifiedOutcome===null),true);
 assert.equal(r.appliedToNaturalRunVerified,false);
 assert.equal(r.customerOrRevenueUpliftVerified,false);
 assert.equal(r.newSchedulers,0);
 assert.equal(r.newWriters,0);
 const later=[...DEFAULT_AGENT_TEAM,{id:'agent-future-client-ux',domains:['Product','UX'],
   capabilities:['analyze','design','verify'],tasks:[],learningContracts:['outcome.v1']}];
 const newRun=buildAllAgentInnovationDuties({agents:later,innovationPortfolio:portfolio,at});
 assert.equal(newRun.agentCount,DEFAULT_AGENT_TEAM.length+1);
 assert.ok(newRun.assignments.some(x=>x.agentId==='agent-future-client-ux'&&x.canAutonomouslyImplement===true));
});

test('security, social, data, customer, cost specialists retain precise bounds',()=>{
 const r=buildAllAgentInnovationDuties({agents:DEFAULT_AGENT_TEAM,innovationPortfolio:portfolio,at});
 const byId=Object.fromEntries(r.assignments.map(x=>[x.agentId,x]));
 assert.equal(byId['agent-security'].innovationId,'autonomous-agent-quality-ratchet');
 assert.equal(byId['agent-cost'].innovationId,'autonomous-agent-quality-ratchet');
 assert.equal(byId['agent-website-ux'].innovationId,'adaptive-portal-ux');
 assert.equal(byId['agent-growth-market'].innovationId,'evidence-backed-buyer-problem-discovery');
 assert.equal(byId['agent-social-delivery-recovery'].protectedReleaseRequired,true);
 assert.equal(r.assignments.every(x=>x.sourceProofRequired&&x.existingExclusiveWriterRequired&&x.nextNaturalRunProofRequired),true);
});

test('unknown, duplicate or unprotected roster and candidate source fail closed',()=>{
 const duplicate=buildAllAgentInnovationDuties({agents:[...DEFAULT_AGENT_TEAM,DEFAULT_AGENT_TEAM[0]],innovationPortfolio:portfolio,at});
 assert.equal(duplicate.status,'UNVERIFIED');
 assert.equal(duplicate.reason,'AGENT_ROSTER_DUPLICATE_OR_MISSING_CAPABILITIES');
 const noSource=buildAllAgentInnovationDuties({agents:DEFAULT_AGENT_TEAM,innovationPortfolio:null,at});
 assert.equal(noSource.status,'UNVERIFIED');
 const noTime=buildAllAgentInnovationDuties({agents:DEFAULT_AGENT_TEAM,innovationPortfolio:portfolio,at:'invalid'});
 assert.equal(noTime.status,'UNVERIFIED');
 const violated=buildAllAgentInnovationDuties({agents:DEFAULT_AGENT_TEAM,innovationPortfolio:{
  innovationCandidates:[{...portfolio.innovationCandidates[0],automaticPromotionAuthorized:true}]
 },at});
 assert.equal(violated.status,'UNVERIFIED');
 assert.deepEqual(violated.assignments,[]);
});

test('daily existing self evolution checks every registered agent without new scheduler',()=>{
 const snapshot=buildDailySelfEvolutionSnapshot({now:at});
 assert.equal(snapshot.status,'READY_FOR_DAILY_SELF_EVOLUTION');
 assert.equal(snapshot.all_agent_innovation_contract_enforced,true);
 assert.equal(snapshot.all_registered_agents_innovation_duty.assignedCount,DEFAULT_AGENT_TEAM.length);
 assert.equal(snapshot.all_registered_agents_innovation_duty.appliedToNaturalRunVerified,false);
 assert.equal(snapshot.all_registered_agents_innovation_duty.assignments.length,DEFAULT_AGENT_TEAM.length);
 const workflow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
 assert.match(workflow,/node --test tests\/brain-all-agent-innovation-duty-20261030\.test\.mjs/);
 assert.equal((workflow.match(/schedule:/g)||[]).length,1);
 assert.doesNotMatch(workflow,/^  pull_request:/m);
 assert.doesNotMatch(workflow,/contents: write/);
 const contract=JSON.parse(readFileSync('config/powerhouse-daily-self-evolution.json','utf8'));
 assert.equal(contract.rules.all_registered_agents_innovation_duty_required,true);
 assert.equal(contract.rules.agent_innovation_assignment_not_execution,true);
});

test('existing original admin-only portal shows all agent assignments and never marks them as paid buyers',()=>{
 const original=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const api=readFileSync('netlify/functions/_powerhouse-compound-improvement-proof.mjs','utf8');
 assert.match(original,/isPowerhouseAdmin\(user/);
 assert.match(api,/agentDutyCoverage=buildAllAgentInnovationDuties/);
 assert.match(ui,/agentDutyCoverage/);
 assert.match(ui,/ASSIGNED_NOT_EXECUTED|executionState/);
 const r=projectCompoundImprovementProof({at,readStates:{}});
 assert.equal(r.innovationPortfolio.agentDutyCoverage.assignedCount,DEFAULT_AGENT_TEAM.length);
 assert.equal(r.innovationPortfolio.agentDutyCoverage.appliedToNaturalRunVerified,false);
 assert.equal(r.innovationPortfolio.agentDutyCoverage.customerOrRevenueUpliftVerified,false);
 assert.equal(r.guarantees.newScheduledExecutors,0);
});
