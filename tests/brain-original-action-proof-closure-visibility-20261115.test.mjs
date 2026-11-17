import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildExecutiveProjection} from '../portal-v2/operating-system/executive-projection.js';
import {buildCustomerActionProgress,customerActionProgressMarkup,customerValueBriefingMarkup} from '../portal-v2/operating-system/customer-value-briefing.js';

const src=['crm:action:1'];
const action=(x={})=>({id:'a1',tenant_id:'tenant-a',status:'DONE',title:'Herstel orderdoorlooptijd',
 baseline_id:'baseline-a',source_refs:src,evidence_health:{status:'healthy'},...x});
const outcome=(x={})=>({action_id:'a1',tenant_id:'tenant-a',status:'OUTCOME_VERIFIED',
 source_refs:['erp:measure:1'],evidence_health:{status:'healthy'},
 realized:{amount:6,unit:'HOURS',metric_id:'lead-time',baseline_id:'baseline-a',period_id:'2026-11'},
 learning_verified:true,learning_evidence_refs:['brain:lesson:1'],next_decision_id:'next:1',...x});
const execution=(x={})=>({action_id:'a1',tenant_id:'tenant-a',baseline_id:'baseline-a',
 status:'INDEPENDENTLY_VERIFIED',independent_readback:true,provider_receipt_id:'erp:receipt:1',source_refs:['erp:receipt:1'],...x});
const model=(actions=[action()],outcomes=[outcome()])=>({available:true,next_best_actions:[],
 action_history:actions,outcomes});

test('DONE is shown in the existing cockpit even when no eligible new recommendation exists; it is not verified execution',()=>{
 const data=model();
 const row=buildCustomerActionProgress(data)[0];
 assert.equal(row.recordedStatus,'DONE');
 assert.equal(row.phase,'EXECUTION_RECEIPT_DUE');
 assert.equal(row.actual,null);
 assert.equal(row.netSaving,null);
 assert.equal(row.closeReviewReady,false);
 assert.equal(row.closedVerified,false);
 const html=customerValueBriefingMarkup(data);
 assert.match(html,/data-customer-value="evidence-due"/);
 assert.match(html,/Wat heeft de intelligentie gedaan/);
 assert.match(html,/Uitvoering niet onafhankelijk bevestigd/);
 assert.match(html,/geen geldig provider/);
 assert.match(html,/data-os-page="next-best-actions"/);
 assert.doesNotMatch(html,/data-action-proof="CLOSED_PROVEN"/);
});

test('execution and verified non-financial outcome with learning are visible and ready for original ONE BRAIN review',()=>{
 const a=action({execution_proof:execution()});
 const rows=buildCustomerActionProgress(model([a]));
 assert.equal(rows.length,1);
 assert.equal(rows[0].phase,'CLOSURE_REVIEW_READY');
 assert.equal(rows[0].actual.amount,6);
 assert.equal(rows[0].actual.unit,'HOURS');
 assert.equal(rows[0].closeReviewReady,true);
 assert.equal(rows[0].closedVerified,false);
 assert.match(customerActionProgressMarkup(model([a])),/6 uur/);
 assert.match(customerActionProgressMarkup(model([a])),/afsluiting is uitsluitend via de bestaande ONE BRAIN-autoriteit mogelijk/);
});

test('actual closure is shown only with independent source-matched original ONE BRAIN receipt',()=>{
 const close={action_id:'a1',tenant_id:'tenant-a',baseline_id:'baseline-a',status:'CLOSED_VERIFIED',
 original_authority:'ONE_BRAIN',independent_readback:true,source_refs:['brain:closure:1']};
 const good=buildCustomerActionProgress(model([action({execution_proof:execution(),closure_proof:close})]))[0];
 assert.equal(good.closedVerified,true);
 assert.equal(good.phase,'CLOSED_PROVEN');
 for(const changed of [{tenant_id:'tenant-b'},{action_id:'other'},{baseline_id:'other'},
 {independent_readback:false},{status:'DONE'},{original_authority:'portal'}, {source_refs:[]}]){
  const row=buildCustomerActionProgress(model([action({execution_proof:execution(),closure_proof:{...close,...changed}})]))[0];
  assert.equal(row.closedVerified,false,JSON.stringify(changed));
 }
});

test('missing or cross-tenant outcome and stale history never create measured improvement or close-ready',()=>{
 assert.equal(buildCustomerActionProgress(model([action({execution_proof:execution()})],[outcome({tenant_id:'tenant-b'})]))[0].actual,null);
 assert.equal(buildCustomerActionProgress(model([action({execution_proof:execution()})],[outcome({status:'SENT'})]))[0].closeReviewReady,false);
 assert.equal(buildCustomerActionProgress(model([action({execution_proof:execution()})],[outcome({learning_verified:false})]))[0].phase,'LEARNING_DUE');
 const stale=action({evidence_health:{status:'stale'}});
 assert.equal(buildCustomerActionProgress(model([stale])).length,0);
 const unscoped=buildExecutiveProjection({powerhouse:{executive:{action_history:[action()]}}},{tenantId:'tenant-b',now:Date.now()});
 assert.equal(unscoped.action_history.length,0);
});

test('financial savings require original verified net proof; duplicate action IDs cannot inflate history',()=>{
 const a=action({execution_proof:execution()});
 const o=outcome({realized:{amount:120,unit:'EUR',metric_id:'NET_SAVINGS_EUR',
 baseline_id:'baseline-a',period_id:'2026-11'},
 financial_measurement:{action_id:'a1',baseline_id:'baseline-a',period_id:'2026-11',comparator:'NO_ACTION',
 method_version:'cost-account-v1',gross_savings_eur:150,implementation_cost_eur:20,operating_cost_eur:10,source_refs:['erp:cost:1']}});
 const rows=buildCustomerActionProgress(model([a,a],[o]));
 assert.equal(rows.length,1);
 assert.equal(rows[0].netSaving,120);
 assert.equal(rows[0].closeReviewReady,true);
 assert.match(customerActionProgressMarkup(model([a],[o])),/120,00/);
 const invalid={...o,financial_measurement:{...o.financial_measurement,operating_cost_eur:null}};
 assert.equal(buildCustomerActionProgress(model([a],[invalid]))[0].netSaving,null);
 assert.equal(buildCustomerActionProgress(model([a],[invalid]))[0].closeReviewReady,false);
});

test('original server tenant gate remains intact; no sender, new database or client-side closing write',async()=>{
 const f=await readFile(new URL('../portal-v2/operating-system/customer-value-briefing.js',import.meta.url),'utf8');
 assert.doesNotMatch(f,/fetch\s*\(|setInterval\s*\(|localStorage|sessionStorage|supabase\.from/);
 // Test actual escaped output; do not use a case-sensitive HTML regexp as a security filter.
 for(const payload of ['<script>alert(1)</script>','<SCRIPT>alert(1)</SCRIPT>','<ScRiPt>alert(1)</ScRiPt>','<IMG SRC=x onerror=alert(1)>']){
  const html=customerActionProgressMarkup(model([action({title:payload})]));
  assert.equal(html.includes(payload),false,'raw attacker-controlled markup was rendered');
  assert.equal(html.toLowerCase().includes('<script'),false,'unescaped script element');
  assert.equal(html.toLowerCase().includes('<img'),false,'unescaped image element');
  assert.match(html,/&lt;/);
 }
 const projection=await readFile(new URL('../portal-v2/operating-system/executive-projection.js',import.meta.url),'utf8');
 assert.match(projection,/safeEvidence\(source\.action_history,tenantId,now\)/);
 assert.match(projection,/action_history:history/);
});


test('existing tenant-authenticated Powerhouse actions are reused without a new store or cross-tenant leak',()=>{
 const when='2026-11-15T11:00:00Z';
 const evidence=(id,tenant)=>({
  id,tenant_id:tenant,entity_type:'signal',source_refs:['original:tenant:action:1'],
  provenance:'powerhouse',freshness_at:when,confidence:0.8,model_or_formula_version:'v1',
  observed_at:when,updated_at:when,status:'DONE',title:'Actie '+id
 });
 const state={powerhouse:{executive:{next_best_actions:[]},actions:[
  evidence('a1','tenant-a'),evidence('a1','tenant-a'),evidence('a2','tenant-b')
 ]}};
 const projection=buildExecutiveProjection(state,{tenantId:'tenant-a',now:Date.parse('2026-11-15T11:20:00Z')});
 assert.equal(projection.available,true);
 assert.deepEqual(projection.action_history.map(x=>x.id),['a1']);
 const progress=buildCustomerActionProgress(projection);
 assert.equal(progress.length,1);
 assert.equal(progress[0].recordedStatus,'DONE');
 assert.equal(progress[0].phase,'EXECUTION_RECEIPT_DUE');
});
