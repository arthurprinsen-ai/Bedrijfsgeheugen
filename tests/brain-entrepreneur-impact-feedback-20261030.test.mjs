import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {outcomeFeedbackRows,outcomeFeedbackMarkup} from '../portal-v2/operating-system/outcome-feedback.js';
import {executiveCockpitMarkup} from '../portal-v2/operating-system/executive-cockpit.js';

const base=()=>({
 available:true,role:'directie',role_label:'Directie',
 evidence_health:{healthy:1,total:1,stale:0,low_confidence:0,unavailable:0},
 attention:[],problems:[],decision_queue:[],next_best_actions:[],outcomes:[],
 risks:[],opportunities:[],changes:[],forecasts:[],health_score:null,strategy_progress:null
});
const verified=(extra={})=>({
 id:'o-1',title:'Offertes sneller verwerken',action_id:'action-5',impact_domain:'Proces',
 status:'OUTCOME_VERIFIED',evidence_health:{status:'healthy',confidence:.97},
 source_refs:['source:customer:1'],observed_at:'2026-10-30T10:00:00Z',
 metric_id:'process-hours',baseline_id:'baseline:2026-09',measurement_period:'2026-10',
 expected:{amount:100,unit:'HOURS'},realized:{amount:120,unit:'HOURS'},
 learning_verified:true,learning_evidence_refs:['brain:verified:1'],
 learning_summary:'Vereenvoudig intake',next_decision_id:'decision:6',
 ...extra
});

test('empty feedback does not invent a realized value or a winning experiment',()=>{
 const html=outcomeFeedbackMarkup([]);
 assert.match(html,/Nog geen acties met meetbare uitkomst/);
 assert.doesNotMatch(html,/data-outcome-verified="true"/);
});

test('provider ACK and executed action never unlock realized impact',()=>{
 for(const status of ['EXECUTED','PROVIDER_VERIFIED','COMPLETED','READBACK_PENDING']){
  const row=outcomeFeedbackRows([verified({status})])[0];
  assert.equal(row.verified,false,status);
  assert.equal(row.realized,null,status);
  assert.equal(row.learned,false,status);
  assert.match(outcomeFeedbackMarkup([verified({status})]),/Resultaat nog niet bewezen/);
 }
});

test('source refs without healthy fresh evidence and terminal verification remain unproven',()=>{
 for(const overrides of [
  {source_refs:[]},
  {evidence_health:{status:'stale'}},
  {evidence_health:{status:'low-confidence'}},
  {evidence_health:{status:'unavailable'}}
 ]){
  assert.equal(outcomeFeedbackRows([verified(overrides)])[0].verified,false);
 }
});

test('strictly verified value can be compared with forecast without treating variance as profit',()=>{
 const row=outcomeFeedbackRows([verified()])[0];
 assert.equal(row.expected,100);
 assert.equal(row.realized,120);
 assert.equal(row.delta,20);
 assert.equal(row.learned,true);
 const html=outcomeFeedbackMarkup([verified()]);
 assert.match(html,/Vooraf verwacht/);
 assert.match(html,/Werkelijk gerealiseerd/);
 assert.match(html,/Verschil/);
 assert.match(html,/20 uur/);
 assert.match(html,/source:customer:1/);
 assert.match(html,/Powerhouse leerde/);
 assert.match(html,/Volgende beslissing: decision:6/);
});

test('missing/mismatched units or amounts prevent false comparison',()=>{
 for(const overrides of [
  {expected:{amount:100,unit:'EUR'},realized:{amount:120,unit:'HOURS'}},
  {expected:{amount:100},realized:{amount:120}},
  {expected:{amount:null,unit:'HOURS'},realized:{amount:120,unit:'HOURS'}}
 ]){
  const row=outcomeFeedbackRows([verified(overrides)])[0];
  assert.equal(row.delta,null);
  assert.match(outcomeFeedbackMarkup([verified(overrides)]),/Nog niet betrouwbaar mogelijk/);
 }
});


test('unmatched metric, baseline or measurement horizon never produce a misleading delta',()=>{
 for(const overrides of [
  {expected:{amount:100,unit:'HOURS',baseline_id:'b1'},realized:{amount:120,unit:'HOURS',baseline_id:'b2'}},
  {expected:{amount:100,unit:'HOURS',period_id:'jan'},realized:{amount:120,unit:'HOURS',period_id:'feb'}},
  {expected:{amount:100,unit:'HOURS',metric_id:'profit'},realized:{amount:120,unit:'HOURS',metric_id:'hours'}},
  {metric_id:null,baseline_id:null,measurement_period:null}
 ]){
  const row=outcomeFeedbackRows([verified(overrides)])[0];
  assert.equal(row.delta,null);
  assert.match(outcomeFeedbackMarkup([verified(overrides)]),/Nog niet betrouwbaar mogelijk/);
 }
});

test('verified outcomes remain visible when unverified outcomes precede them',()=>{
 const items=[...Array.from({length:6},(_,i)=>verified({id:'pending-'+i,status:'PROVIDER_VERIFIED'})),verified({id:'real'})];
 const rows=outcomeFeedbackRows(items);
 assert.equal(rows.length,4);
 assert.equal(rows[0].id,'real');
 assert.match(outcomeFeedbackMarkup(items),/data-os-page="monitoring-learning"/);
});

test('learning is never claimed from an outcome alone',()=>{
 for(const extra of [
  {learning_verified:false},
  {learning_evidence_refs:[]},
  {next_decision_id:null}
 ]){
  const item=verified(extra);
  assert.equal(outcomeFeedbackRows([item])[0].learned,false);
  assert.match(outcomeFeedbackMarkup([item]),/Leereffect nog niet geverifieerd/);
 }
});

test('untrusted titles, values and source references are escaped',()=>{
 const html=outcomeFeedbackMarkup([verified({title:'<img src=x onerror=alert(1)>',source_refs:['<script>']})]);
 assert.doesNotMatch(html,/<script>|<img src/);
 assert.match(html,/&lt;script&gt;/);
});

test('executive cockpit puts consistent comparison on both tenant and empty states',()=>{
 const active=base();active.outcomes=[verified()];
 const html=executiveCockpitMarkup(active);
 assert.match(html,/data-outcome-feedback="results"/);
 assert.match(html,/Offertes sneller verwerken/);
 assert.match(executiveCockpitMarkup({available:false,role_label:'Directie'}),/data-outcome-feedback="empty"/);
});

test('feedback stays read-only and mobile/keyboard navigable, reusing the current OS',async()=>{
 const code=await readFile(new URL('../portal-v2/operating-system/outcome-feedback.js',import.meta.url),'utf8');
 const styles=await readFile(new URL('../portal-v2/operating-system/styles.js',import.meta.url),'utf8');
 assert.doesNotMatch(code,/fetch\s*\(|setInterval\s*\(|localStorage|sessionStorage|supabase\.from/);
 assert.match(code,/<details>/);
 assert.match(code,/<summary>/);
 assert.match(styles,/\.os-outcome-compare/);
 assert.match(styles,/\.os-outcome-card summary:focus-visible/);
 assert.match(styles,/@media\(max-width:700px\)/);
});
