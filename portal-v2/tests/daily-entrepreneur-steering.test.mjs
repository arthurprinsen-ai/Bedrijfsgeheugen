import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {executiveCockpitMarkup} from '../operating-system/executive-cockpit.js';

const base=()=>({
 available:true,role:'directie',role_label:'Directie',
 evidence_health:{healthy:0,total:0,stale:0,low_confidence:0,unavailable:0},
 attention:[],problems:[],decision_queue:[],next_best_actions:[],outcomes:[],
 risks:[],opportunities:[],changes:[],forecasts:[],health_score:null,strategy_progress:null
});
function outcome(overrides={}){
 return {id:'outcome-1',title:'Doorlooptijd aantoonbaar gedaald',status:'VERIFIED',
  evidence_health:{status:'healthy',confidence:0.95},source_refs:['receipt-1'],
  learning_verified:true,learning_evidence_refs:['learning-1'],
  learning_summary:'Andere volgorde voorkomt wachttijd',next_decision_id:'decision-2',...overrides};
}

test('five-stage daily steering exists without a tenant projection; nothing is fabricated',()=>{
 const html=executiveCockpitMarkup({available:false,role_label:'Directie'});
 for(const label of ['1 · Weten','2 · Beslissen','3 · Doen','4 · Meten','5 · Leren'])assert.ok(html.includes(label),label);
 assert.match(html,/Uitkomst nog niet bewezen/);
 assert.match(html,/Leereffect nog niet bewezen/);
 assert.doesNotMatch(html,/data-os-status="live"/);
});

test('an action, predicted benefit or outcome without verified receipt cannot be reported as measured or learned',()=>{
 const model=base();
 model.outcomes=[outcome({status:'EXECUTED'}),outcome({id:'outcome-2',status:'VERIFIED',source_refs:[]}),outcome({id:'outcome-3',status:'VERIFIED',evidence_health:{status:'stale'}})];
 const html=executiveCockpitMarkup(model);
 assert.match(html,/data-steering-stage="measure"/);
 assert.match(html,/data-steering-stage="learn"/);
 assert.match(html,/Uitkomst nog niet bewezen/);
 assert.match(html,/Leereffect nog niet bewezen/);
 const measurement=html.split('data-steering-stage="measure"')[1].split('</article>')[0];
 assert.doesNotMatch(measurement,/Doorlooptijd aantoonbaar gedaald/);
});

test('external provider ACK is not a realized business outcome',()=>{
 const model=base();
 model.outcomes=[outcome({status:'PROVIDER_VERIFIED',learning_verified:false})];
 const html=executiveCockpitMarkup(model);
 const measurement=html.split('data-steering-stage="measure"')[1].split('</article>')[0];
 assert.match(measurement,/Uitkomst nog niet bewezen/);
 assert.match(html,/Leereffect nog niet bewezen/);
});

test('only independently evidenced verified outcomes and explicitly linked learning close final stages',()=>{
 const model=base();
 model.outcomes=[outcome()];
 const html=executiveCockpitMarkup(model);
 assert.match(html,/4 · Meten/);
 assert.match(html,/Doorlooptijd aantoonbaar gedaald/);
 assert.match(html,/Andere volgorde voorkomt wachttijd/);
 assert.match(html,/Volgende beslissing: decision-2/);
 assert.match(html,/data-os-page="monitoring-learning"/);
});

test('verified outcome without independent learning trace still has open learning stage',()=>{
 const model=base();
 model.outcomes=[outcome({learning_evidence_refs:[]})];
 const html=executiveCockpitMarkup(model);
 assert.match(html,/Doorlooptijd aantoonbaar gedaald/);
 assert.match(html,/Leereffect nog niet bewezen/);
});

test('existing tabs and one Brain remain the only execution and measurement routes',async()=>{
 const source=await readFile(new URL('../operating-system/executive-cockpit.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../operating-system/styles.js',import.meta.url),'utf8');
 assert.match(source,/mountOperatingSystemPage/);
 assert.match(source,/data-os-page="monitoring-learning"/);
 assert.match(css,/\.os-mobile-decision-flow\{display:grid/);
 assert.doesNotMatch(source,/fetch\s*\(|setInterval\s*\(|localStorage|sessionStorage/);
});
