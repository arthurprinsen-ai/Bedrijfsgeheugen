import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifiedCustomerOutcome,outcomeFeedbackRows,outcomeFeedbackMarkup} from '../portal-v2/operating-system/outcome-feedback.js';
import {executiveCockpitMarkup} from '../portal-v2/operating-system/executive-cockpit.js';
import {strategicAdviceItems} from '../portal-v2/operating-system/strategic-advisor.js';

const outcome=(changes={})=>({
 id:'outcome-1',action_id:'action-1',title:'Verkort de verwerkingstijd',
 status:'OUTCOME_VERIFIED',evidence_health:{status:'healthy',confidence:.98},
 source_refs:['crm:observed:1'],observed_at:'2026-11-02T06:00:00Z',
 realized:{amount:12,unit:'HOURS',metric_id:'time_saved',baseline_id:'baseline:oct',period_id:'2026-11'},
 learning_verified:true,learning_evidence_refs:['brain:verified:outcome-1'],next_decision_id:'decision:after',
 ...changes
});
const model=(outcomes)=>({
 available:true,role:'directie',role_label:'Directie',
 attention:[],risks:[],problems:[],opportunities:[],changes:[],forecasts:[],decision_queue:[],
 evidence_health:{healthy:1,total:1,stale:0,low_confidence:0,unavailable:0},
 health_score:null,strategy_progress:null,
 next_best_actions:[{id:'action-1',title:'Verkort de verwerkingstijd',next_action:'Controleer intake',status:'PROPOSED',source_refs:['crm:opportunity:1'],evidence_health:{status:'healthy'},expected_impact:{kind:'forecast',unit:'EUR',amount:1500}}],
 outcomes
});

test('an independently verified label without a measured business metric stays unproven across every portal surface',()=>{
 const fake=outcome({realized:null});
 assert.equal(verifiedCustomerOutcome(fake),false);
 assert.equal(outcomeFeedbackRows([fake])[0].verified,false);
 const feedback=outcomeFeedbackMarkup([fake]);
 assert.match(feedback,/Gemeten effect nog niet bewezen/);
 assert.doesNotMatch(feedback,/data-outcome-verified="true"/);
 const daily=executiveCockpitMarkup(model([fake]));
 assert.match(daily,/Uitkomst nog niet bewezen/);
 assert.match(daily,/Leereffect nog niet bewezen/);
 assert.equal(strategicAdviceItems(model([fake]))[0].verifiedOutcomes,0);
});

test('missing action, amount, unit, metric, baseline, period, healthy refs or terminal status never count as realized value',()=>{
 const invalid=[
  {action_id:''}, {realized:{unit:'EUR',metric_id:'m',baseline_id:'b',period_id:'p'}},
  {realized:{amount:100,metric_id:'m',baseline_id:'b',period_id:'p'}},
  {realized:{amount:100,unit:'EUR',baseline_id:'b',period_id:'p'}},
  {realized:{amount:100,unit:'EUR',metric_id:'m',period_id:'p'}},
  {realized:{amount:100,unit:'EUR',metric_id:'m',baseline_id:'b'}},
  {realized:{amount:' ',unit:'EUR',metric_id:'m',baseline_id:'b',period_id:'p'}},
  {status:'PROVIDER_VERIFIED'}, {status:'EXECUTION_COMPLETED'},
  {source_refs:[]},{evidence_health:{status:'stale'}}
 ];
 for(const change of invalid){
  const item=outcome(change);
  assert.equal(verifiedCustomerOutcome(item),false,JSON.stringify(change));
  assert.equal(outcomeFeedbackRows([item])[0].learned,false);
  assert.equal(strategicAdviceItems(model([item]))[0].verifiedOutcomes,0);
 }
});

test('typed zero is a valid measured outcome but does not automatically prove causal revenue',()=>{
 const item=outcome({realized:{amount:0,unit:'EUR',metric_id:'observed_net_value',baseline_id:'baseline:oct',period_id:'2026-11'}});
 assert.equal(verifiedCustomerOutcome(item),true);
 const row=outcomeFeedbackRows([item])[0];
 assert.equal(row.realized,0);
 assert.equal(row.verified,true);
 assert.match(outcomeFeedbackMarkup([item]),/niet automatisch door Powerhouse veroorzaakte winst/);
});

test('genuine measured evidence and learning proof are visible in one coherent cockpit and advisor',()=>{
 const item=outcome();
 assert.equal(verifiedCustomerOutcome(item),true);
 assert.equal(strategicAdviceItems(model([item]))[0].verifiedOutcomes,1);
 const html=executiveCockpitMarkup(model([item]));
 assert.match(html,/Gemeten effect onafhankelijk bevestigd/);
 assert.match(html,/Verkort de verwerkingstijd/);
 assert.match(html,/Geverifieerde leerstap|Volgende beslissing:/);
});

test('free trial completed without paid provider receipt is never treated as a paid business outcome',()=>{
 const trial=outcome({status:'COMPLETED',realized:null,source_refs:['saas_checkout_intent:trial:completed']});
 assert.equal(verifiedCustomerOutcome(trial),false);
 assert.equal(strategicAdviceItems(model([trial]))[0].verifiedOutcomes,0);
 const html=outcomeFeedbackMarkup([trial]);
 assert.match(html,/geen meetbaar bedrijfsresultaat/);
});

test('existing original gates are shared and rendering stays read-only with no new runtime or authority',async()=>{
 const files=['outcome-feedback.js','executive-cockpit.js','strategic-advisor.js'];
 for(const file of files){
  const c=await readFile(new URL('../portal-v2/operating-system/'+file,import.meta.url),'utf8');
  assert.doesNotMatch(c,/\bfetch\s*\(|localStorage|sessionStorage|supabase\.from|setInterval\s*\(/);
  if(file!=='outcome-feedback.js')assert.match(c,/verifiedCustomerOutcome/);
 }
});
