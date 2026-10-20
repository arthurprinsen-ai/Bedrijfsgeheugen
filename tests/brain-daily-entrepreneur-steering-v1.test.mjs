import test from 'node:test';
import assert from 'node:assert/strict';
import {executiveCockpitMarkup} from '../portal-v2/operating-system/executive-cockpit.js';

function model(outcomes=[]){
 return {available:true,role:'directie',role_label:'Directie',
  evidence_health:{healthy:0,total:0,stale:0,low_confidence:0,unavailable:0},
  attention:[],problems:[],decision_queue:[],next_best_actions:[],
  outcomes,risks:[],opportunities:[],changes:[],forecasts:[],
  health_score:null,strategy_progress:null};
}
function result(overrides={}){
 return {id:'o-1',title:'Doorlooptijd gedaald',status:'OUTCOME_VERIFIED',
  evidence_health:{status:'healthy',confidence:.9},source_refs:['receipt:1'],
  learning_verified:true,learning_evidence_refs:['learning:1'],
  learning_summary:'Wachtstappen samenvoegen',next_decision_id:'decision:2',
  ...overrides};
}
test('historical replay: no tenant evidence is never reported as realized or learned',()=>{
 const html=executiveCockpitMarkup({available:false,role_label:'Directie'});
 for(const stage of ['1 · Weten','2 · Beslissen','3 · Doen','4 · Meten','5 · Leren'])assert.ok(html.includes(stage));
 assert.match(html,/Uitkomst nog niet bewezen/);
 assert.match(html,/Leereffect nog niet bewezen/);
});
test('shadow: provider delivery cannot stand in for realized business outcome',()=>{
 const html=executiveCockpitMarkup(model([result({status:'PROVIDER_VERIFIED'})]));
 const measure=html.split('data-steering-stage="measure"')[1].split('</article>')[0];
 assert.match(measure,/Uitkomst nog niet bewezen/);
 assert.match(html,/Leereffect nog niet bewezen/);
});
test('canary: actual verified receipt plus learning reference and next decision close the visible cycle',()=>{
 const html=executiveCockpitMarkup(model([result()]));
 assert.match(html,/Doorlooptijd gedaald/);
 assert.match(html,/Wachtstappen samenvoegen/);
 assert.match(html,/Volgende beslissing: decision:2/);
});
test('fail closed: verified outcome without next decision cannot be called learning',()=>{
 const html=executiveCockpitMarkup(model([result({next_decision_id:null})]));
 assert.match(html,/Doorlooptijd gedaald/);
 assert.match(html,/Leereffect nog niet bewezen/);
});
