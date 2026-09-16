import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategicModels, STRATEGIC_MODEL_IDS, buildStrategicRoadmapAction, mergeStrategicRoadmapAction } from '../strategic-models.js';

const REQUIRED=[
 'toc','seven-s','value-chain','five-forces','bcg','ansoff','destep','adkar','swot','balanced-scorecard','blue-ocean','three-horizons','ulrich','sipoc','raci','ocai','sales-funnel','aarrr','kraljic','pareto-receivables'
];
const maturity={sturing:3,commercie:2,operatie:2,finance:3,mensen:2,analytics:4,quality:4,governance:3,tech:4,culture:2,service:2,security:3,duurzaam:2};
const state={portal:{profile:{employees:32,maturity},metrics:{largestCustomer:15,marketing:25,newCustomers:0,dso:45},market:{growth:1,digitalMaturity:3},strategicModels:{}},roadmap:[]};

test('strategic model registry contains every protected legacy non-finance strategy model',()=>{
 assert.deepEqual([...STRATEGIC_MODEL_IDS].sort(),REQUIRED.sort());
});

test('buildStrategicModels returns every model once with explanation, conclusion and evidence source',()=>{
 const models=buildStrategicModels(state);
 assert.equal(models.length,REQUIRED.length);
 assert.equal(new Set(models.map(model=>model.id)).size,REQUIRED.length);
 for(const model of models){
   assert.ok(model.title,`${model.id}: title`);
   assert.ok(model.source,`${model.id}: source`);
   assert.ok(model.explanation,`${model.id}: explanation`);
   assert.ok(model.conclusion,`${model.id}: conclusion`);
   assert.ok(model.evidence,`${model.id}: evidence`);
 }
});

test('legacy trigger semantics are preserved for core models',()=>{
 const byId=Object.fromEntries(buildStrategicModels(state).map(model=>[model.id,model]));
 assert.equal(byId.toc.signal,'operatie');
 assert.equal(byId['seven-s'].signal,'hard-ahead');
 assert.equal(byId['value-chain'].signal,'service-gap');
 assert.equal(byId.ansoff.signal,'existing-customer-growth');
 assert.equal(byId.adkar.signal,'change-readiness-gap');
 assert.equal(byId.ulrich.signal,'skills-risk');
 assert.equal(byId.sipoc.signal,'process-documentation-gap');
 assert.equal(byId.raci.signal,'decision-rights');
 assert.equal(byId.ocai.signal,'culture-gap');
 assert.equal(byId['sales-funnel'].signal,'conversion-gap');
 assert.equal(byId.aarrr.signal,'acquisition-measurement-gap');
 assert.equal(byId['pareto-receivables'].signal,'receivables-focus');
});

test('every strategic model can produce a deterministic canonical roadmap action and dedupe it',()=>{
 for(const model of buildStrategicModels(state)){
   const action=buildStrategicRoadmapAction(model);
   assert.equal(action.source,model.id);
   assert.ok(action.id.startsWith(`strategy-${model.id}-`));
   const once=mergeStrategicRoadmapAction({...state,roadmap:[]},action);
   const twice=mergeStrategicRoadmapAction(once,action);
   assert.equal(twice.roadmap.filter(item=>item.id===action.id).length,1,model.id);
 }
});
