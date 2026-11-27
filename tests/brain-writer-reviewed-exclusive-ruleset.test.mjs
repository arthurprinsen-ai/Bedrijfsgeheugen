import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewExclusiveRulesetProposal as review,exclusiveRulesetProposalBytes as bytes} from '../tools/delivery/reviewed-exclusive-ruleset.mjs';
const denied=(x)=>{const r=review(x);assert.notEqual(r.state,'EXACT_PROPOSAL_SHAPE_REVIEW_ONLY');assert.equal(r.mutationAuthority,false);assert.equal(r.providerEnforced,false);assert.equal(r.activationAuthorized,false)};
test('exact topology is review only',()=>assert.deepEqual(review(bytes()),{state:'EXACT_PROPOSAL_SHAPE_REVIEW_ONLY',mutationAuthority:false,providerEnforced:false,activationAuthorized:false}));
test('canonical output independent from input',()=>{const a=JSON.parse(bytes());a.rules[0].type='deletion';assert.equal(JSON.parse(bytes()).rules[0].type,'update')});
const cases={
 'wrong app':p=>p.bypass_actors[0].actor_id=15368,
 'always bypass':p=>p.bypass_actors[0].bypass_mode='always',
 'role bypass':p=>p.bypass_actors[0].actor_type='RepositoryRole',
 'extra admin':p=>p.bypass_actors.push({actor_id:5,actor_type:'RepositoryRole',bypass_mode:'always'}),
 'no app':p=>p.bypass_actors=[],
 'wildcard scope':p=>p.conditions.ref_name.include=['refs/heads/*'],
 'excluded main':p=>p.conditions.ref_name.exclude=['refs/heads/main'],
 'disabled':p=>p.enforcement='disabled',
 'evaluate':p=>p.enforcement='evaluate',
 'extra CI rule subject to bypass':p=>p.rules.push({type:'required_status_checks'}),
 'fetch and merge exception':p=>p.rules[0].parameters.update_allows_fetch_and_merge=true,
 'missing parameter':p=>delete p.rules[0].parameters,
 'wrong target':p=>p.target='tag',
 'wrong rule':p=>p.rules[0].type='creation',
 'extra root field':p=>p.unreviewed=true,
 'wrong name':p=>p.name='another',
 'wrong actor id type':p=>p.bypass_actors[0].actor_id='5916428',
 'extra nested parameter':p=>p.rules[0].parameters.extra=true,
 'missing condition':p=>delete p.conditions,
 'wrong array shape':p=>p.rules={'0':p.rules[0]}
};for(const [name,mutate] of Object.entries(cases))test(name,()=>{const p=JSON.parse(bytes());mutate(p);denied(JSON.stringify(p))});
for(const v of [null,{},'null','{','[]','x'.repeat(8193)])test('invalid input '+String(v).slice(0,12),()=>denied(v));
