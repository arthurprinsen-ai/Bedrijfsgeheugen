import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCustomerValueBriefing,customerValueBriefingMarkup} from '../portal-v2/operating-system/customer-value-briefing.js';

const action=(changes={})=>({id:'action-1',title:'Verkort de offertedoorlooptijd',problem_id:'PH-P123',next_action:'Analyseer wachtende offertes',status:'PROPOSED',
 source_refs:['crm:lead:1'],evidence_health:{status:'healthy'},success_metric:'Offerte-doorlooptijd',baseline_id:'baseline-1',
 expected_impact:{kind:'forecast',amount:2000,unit:'EUR'},...changes});
const outcome=(changes={})=>({action_id:'action-1',status:'OUTCOME_VERIFIED',source_refs:['crm:order:123'],evidence_health:{status:'healthy'},
 realized:{amount:35,unit:'HOURS',metric_id:'hours-saved',baseline_id:'baseline-1',period_id:'2026-10'},...changes});
const model=(a=[action()],o=[])=>({available:true,next_best_actions:a,outcomes:o,problems:[{problem_id:'PH-P123',title:'Offertes blijven liggen',
 source_refs:['crm:problem:1'],evidence_health:{status:'healthy'}}]});

test('missing tenant evidence, source or eligible action never promise improvement',()=>{
 assert.equal(buildCustomerValueBriefing({available:false}).available,false);
 for(const x of [action({source_refs:[]}),action({evidence_health:{status:'stale'}}),action({status:'COMPLETED'}),action({status:'BLOCKED'})])
  assert.equal(buildCustomerValueBriefing(model([x])).available,false);
 assert.match(customerValueBriefingMarkup(model([action({status:'BLOCKED'})])),/data-customer-value="evidence-due"/);
});
test('the owner gets one next decision, real measure, source and visible permission',()=>{
 const b=buildCustomerValueBriefing(model([action({requires_approval:true})]));
 assert.equal(b.metric,'Offerte-doorlooptijd');assert.equal(b.baseline,'baseline-1');assert.equal(b.result,null);
 const html=customerValueBriefingMarkup(model([action({requires_approval:true})]));
 assert.match(html,/2.000/);assert.match(html,/geen realisatie/);assert.match(html,/toestemming/);
 assert.match(html,/Werkelijk resultaat:.*nog niet aangetoond/);
});
test('delivery receipts and execution completion are not financial or customer value',()=>{
 for(const status of ['EXECUTION_COMPLETED','SENT','PROVIDER_VERIFIED','READBACK_PENDING']){
  assert.equal(buildCustomerValueBriefing(model([action()],[outcome({status})])).result,null,status);
 }
});
test('value requires matching action, terminal verification, healthy evidence, metric, baseline and period',()=>{
 const invalid=[outcome({action_id:'other'}),outcome({evidence_health:{status:'stale'}}),outcome({source_refs:[]}),
  outcome({realized:{amount:null,unit:'EUR',metric_id:'revenue',baseline_id:'b',period_id:'p'}}),
  outcome({realized:{amount:5,unit:'EUR',metric_id:'revenue'}})];
 for(const o of invalid)assert.equal(buildCustomerValueBriefing(model([action()],[o])).result,null);
 const b=buildCustomerValueBriefing(model([action()],[outcome()]));
 assert.equal(b.result.amount,35);assert.equal(b.result.learningProven,false);
 assert.match(customerValueBriefingMarkup(model([action()],[outcome()])),/niet automatisch door deze actie veroorzaakte winst/);
});
test('learning requires independent verified outcome, learning proof and next decision',()=>{
 const o=outcome({learning_verified:true,learning_evidence_refs:['brain:lesson:1'],next_decision_id:'next:1'});
 assert.equal(buildCustomerValueBriefing(model([action()],[o])).result.learningProven,true);
});
test('escaped UI, read-only, same Portal V2 navigation and responsive existing styles',async()=>{
 const html=customerValueBriefingMarkup(model([action({title:'<img src=x onerror=alert(1)>',source_refs:['<script>']})]));
 assert.doesNotMatch(html,/<img\b|<script\b/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);
 const code=await readFile(new URL('../portal-v2/operating-system/customer-value-briefing.js',import.meta.url),'utf8');
 assert.doesNotMatch(code,/fetch\s*\(|setInterval\s*\(|localStorage|sessionStorage|supabase\.from/);
 assert.match(html,/data-os-page="next-best-actions"/);
 const cockpit=await readFile(new URL('../portal-v2/operating-system/executive-cockpit.js',import.meta.url),'utf8');
 assert.match(cockpit,/customerValueBriefingMarkup\(model\)/);
 assert.match(cockpit,/import \{customerValueBriefingMarkup\}/);
});
