import test from 'node:test';
import assert from 'node:assert/strict';
import { planOpportunityFollowups } from '../brain/revenue/opportunity-next-action-coverage.mjs';

const now='2026-10-25T12:00:00Z';
const entry=(key,more={})=>({
  opportunity_key:key,status:'open',created_at:'2026-10-20T00:00:00Z',
  next_action_at:null,...more
});
const assess=(key,classification='RESEARCH_REQUIRED',more={})=>({
  opportunityKey:key,classification,nextAction:'VERIFY_NEED_IMPACT_AND_URGENCY',
  missingEvidence:['verified_first_party_buying_signal'],evidenceRefs:[],...more
});

test('every open opportunity is assessed; future and closed records are never replanned',()=>{
  const plan=planOpportunityFollowups({
    now,opportunities:[
      entry('missing'),entry('expired',{next_action_at:'2026-10-22T00:00:00Z'}),
      entry('future',{next_action_at:'2026-10-28T00:00:00Z'}),
      entry('closed',{status:'won'}),entry('missing')
    ],
    assessments:[assess('missing'),assess('expired'),assess('future'),assess('closed')]
  });
  assert.equal(plan.open,3);
  assert.equal(plan.withoutNextActionDate,1);
  assert.equal(plan.overdue,1);
  assert.equal(plan.alreadyScheduled,1);
  assert.equal(plan.planned,2);
  assert.equal(plan.remainingDue,0);
  assert.ok(plan.actions.every(a=>a.dueAt>now));
  assert.ok(plan.actions.every(a=>a.obligation.payload.outreach_authorized===false));
});

test('verified high-priority work gets a bounded lane; research cannot starve',()=>{
  const input=[...Array.from({length:20},(_,i)=>entry('high-'+i)),...Array.from({length:20},(_,i)=>entry('research-'+i))];
  const evaluations=input.map(x=>assess(x.opportunity_key,x.opportunity_key.startsWith('high')
    ?'PROPOSAL_FOLLOW_UP':'RESEARCH_REQUIRED'));
  const plan=planOpportunityFollowups({
    now,opportunities:input,assessments:evaluations,limit:12,highPriorityLimit:3
  });
  assert.equal(plan.planned,12);
  assert.equal(plan.actions.filter(x=>x.classification==='PROPOSAL_FOLLOW_UP').length,3);
  assert.equal(plan.actions.filter(x=>x.classification==='RESEARCH_REQUIRED').length,9);
  assert.equal(plan.remainingDue,28);
});

test('suppressed prospects create no contact authorization or marketing send',()=>{
  const plan=planOpportunityFollowups({
    now,opportunities:[entry('privacy:blocked')],
    assessments:[assess('privacy:blocked','NO_CONTACT',{nextAction:'SUPPRESS_EXTERNAL_CONTACT'})]
  });
  assert.equal(plan.actions.length,1);
  assert.equal(plan.actions[0].obligation.payload.contact_policy,'SUPPRESSION_NO_EXTERNAL_CONTACT');
  assert.equal(plan.actions[0].obligation.payload.execution_state,'PLANNED_NOT_EXECUTED');
  assert.equal(plan.actions[0].action,'SUPPRESS_EXTERNAL_CONTACT');
});

test('stable dedupe and no imaginary revenue or executed actions',()=>{
  const data={now,opportunities:[entry('same:opportunity')],
    assessments:[assess('same:opportunity')]};
  const first=planOpportunityFollowups(data),replayed=planOpportunityFollowups(data);
  assert.equal(first.actions[0].obligation.obligation_id,replayed.actions[0].obligation.obligation_id);
  assert.deepEqual(first.actions,replayed.actions);
  assert.equal(first.schedulingIsNotExecution,true);
  assert.equal(first.revenueVerifiedByPlanner,false);
});

test('hard limits fail closed and missing canonical assessment cannot create an obligation',()=>{
  assert.throws(()=>planOpportunityFollowups({now,limit:500}),/BOUNDED_LIMIT/);
  assert.throws(()=>planOpportunityFollowups({now:'bad-date'}),/VALID_TIME/);
  const plan=planOpportunityFollowups({now,opportunities:[entry('unassessed')]});
  assert.equal(plan.planned,0);
  assert.equal(plan.remainingDue,1);
});

test('malformed model suggestion cannot turn internal research into automatic outreach',()=>{
  const plan=planOpportunityFollowups({now,
    opportunities:[entry('weak-buying-signal')],
    assessments:[assess('weak-buying-signal','RESEARCH_REQUIRED',{nextAction:'SEND_COLD_EMAIL'})]
  });
  assert.equal(plan.actions[0].action,'VERIFY_NEED_IMPACT_AND_URGENCY');
  assert.equal(plan.actions[0].obligation.payload.outreach_authorized,false);
});
