import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {strategicAdviceItems,strategicAdvisorMarkup} from '../portal-v2/operating-system/strategic-advisor.js';
import {executiveCockpitMarkup} from '../portal-v2/operating-system/executive-cockpit.js';

const action=(more={})=>({
 id:'a-12',title:'Verkort offerteproces',problem_id:'PH-P127',
 explanation:'Doorlooptijd heeft prioriteit',reason:'Leads wachten op opvolging',
 next_action:'Controleer intake en maak een plan',owner:'Sales',
 evidence_health:{status:'healthy',confidence:.91},source_refs:['provider:crm:4'],
 expected_impact:{kind:'forecast',amount:3200,unit:'EUR'},
 strategic_options:[{title:'Automatiseer intake',reason:'Test tijdsbesparing',source_refs:['study:4']}],
 ...more
});
const model=(actions=[])=>({
 available:true,role:'directie',role_label:'Directie',next_best_actions:actions,decision_queue:[],attention:[],
 evidence_health:{healthy:0,total:0,stale:0,low_confidence:0,unavailable:0},
 problems:[],risks:[],opportunities:[],outcomes:[],changes:[],forecasts:[],health_score:null,strategy_progress:null
});

test('without tenant evidence adviser does not invent strategic initiatives or ROI',()=>{
 assert.deepEqual(strategicAdviceItems({available:false}),[]);
 const html=strategicAdvisorMarkup({available:false});
 assert.match(html,/data-strategy-status="evidence-due"/);
 assert.match(html,/geen alsof-advies/);
 assert.doesNotMatch(html,/3.200/);
});
test('adviser uses only source-backed healthy next best actions',()=>{
 const state=model([action({id:'not-verified',evidence_health:{status:'stale'}}),action({id:'no-refs',source_refs:[]}),action()]);
 const rows=strategicAdviceItems(state);
 assert.equal(rows.length,1);
 assert.equal(rows[0].id,'a-12');
 assert.match(rows[0].expected,/3\.200/);
 assert.equal(rows[0].expectedKind,'forecast');
 assert.equal(rows[0].verifiedOutcomes,0);
});
test('expected value is explicitly a forecast, never booked revenue',()=>{
 const html=strategicAdvisorMarkup(model([action()]));
 assert.match(html,/Verwachte impact \(forecast\), geen bewezen resultaat/);
 assert.match(html,/Zakelijk resultaat van deze actie nog niet bewezen/);
 assert.match(html,/Welke opties en afwegingen zijn er/);
 assert.match(html,/Bekijk besluit en actie/);
});
test('unqualified estimates, unbacked options and zero actual proof remain unknown',()=>{
 const a=action({expected_impact:{kind:'realized',unit:'EUR',amount:999999},
 strategic_options:[{title:'Eens proberen',source_refs:[]}],requires_approval:true});
 const html=strategicAdvisorMarkup(model([a]));
 assert.match(html,/Nog niet betrouwbaar te kwantificeren/);
 assert.match(html,/Alternatieven inclusief niets doen zijn nog niet afzonderlijk onderbouwd/);
 assert.match(html,/toestemming vereist/);
 assert.doesNotMatch(html,/999.999/);
});
test('independent verified outcome must have a matching nonempty action ID',()=>{
 const m=model([action()]);
 m.outcomes=[
  {action_id:'a-12',status:'PROVIDER_VERIFIED',evidence_health:{status:'healthy'},source_refs:['x']},
  {action_id:'other',status:'OUTCOME_VERIFIED',evidence_health:{status:'healthy'},source_refs:['y']},
  {action_id:'a-12',status:'OUTCOME_VERIFIED',evidence_health:{status:'stale'},source_refs:['z']},
  {action_id:'a-12',status:'OUTCOME_VERIFIED',evidence_health:{status:'healthy'},source_refs:['receipt:1']}
 ];
 assert.equal(strategicAdviceItems(m)[0].verifiedOutcomes,1);
 assert.equal(strategicAdviceItems(model([action({id:null})]))[0].verifiedOutcomes,0);
});
test('no title, source or rationale can inject HTML into executive briefing',()=>{
 const html=strategicAdvisorMarkup(model([action({title:'<img src=x onerror=alert(1)>',
  explanation:'<script>alert(1)</script>',source_refs:['<svg onload=alert(1)>']})]));
 assert.doesNotMatch(html,/<script>|<img src/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;svg/);
});
test('executive cockpit and decision page reuse one visible strategic adviser',async()=>{
 const html=executiveCockpitMarkup(model([action()]));
 assert.match(html,/data-strategy-status="evidence-backed"/);
 const code=await readFile(new URL('../portal-v2/operating-system/operating-system-ui.js',import.meta.url),'utf8');
 assert.match(code,/strategicAdvisorMarkup\(buildExecutiveProjection\(state/);
 assert.match(code,/data-os-page/);
 const adviser=await readFile(new URL('../portal-v2/operating-system/strategic-advisor.js',import.meta.url),'utf8');
 assert.doesNotMatch(adviser,/fetch\s*\(|localStorage|sessionStorage|setInterval\s*\(|supabase\.from/);
});
test('keyboard, responsive and context details are present',async()=>{
 const css=await readFile(new URL('../portal-v2/operating-system/styles.js',import.meta.url),'utf8');
 assert.match(css,/\.os-strategy-grid/);
 assert.match(css,/\.os-strategy-card summary:focus-visible/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(strategicAdvisorMarkup(model([action()])),/<details><summary>/);
});
