import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPowerhouseIntegrationReadback} from '../platform/portal/powerhouse-existing-integration-read-model.mjs';
import {powerhouseIntegrationMarkup} from '../portal-v2/control-plane-cockpit.js';

const sources=['health','capabilities','layers','experiments','revenue','loops','terminal'];
const fixture=()=>({
 readStates:Object.fromEntries(sources.map(x=>[x,'LIVE'])),
 datasets:{
  health:[{observed_at:'2026-10-29T21:17:00Z',total_layers:32,wired_layers:32,required_jobs:18,active_jobs:18,current_runtime_errors:2,evidence_sparse_required_layers:2,content_loop_state:'BLOCKED',architecture_state:'AMBER',learning_state:'EVIDENCE_DUE'}],
  capabilities:[],layers:[],experiments:[{readiness_state:'BLOCKED',assignments:0,holdout_assignments:0}],revenue:[{scored_prospects:858,next_best_actions:1,realized_revenue_eur:0}],
  loops:[{observed_at:'2026-10-29T21:17:00Z',total_loops:15,green_loops:8,amber_loops:3,red_loops:4,fully_evidenced_loops:12,overall_status:'RED'}],
  terminal:[{observed_at:'2026-10-29T21:17:00Z',nonterminal_obligations:29,blocked_obligations:2,escalated_reconciliation_jobs:2,control_plane_healthy:false,stale_green_truths:0}]
 }
});
test('real red loop and escalated terminal obligations are visible despite all layers wired',()=>{
 const projection=projectPowerhouseIntegrationReadback(fixture());
 assert.equal(projection.sourceState,'READABLE');
 assert.equal(projection.integrationState,'END_TO_END_UNPROVEN');
 assert.equal(projection.architecture.wiredLayers,32);
 assert.equal(projection.loopAssurance.state,'RED');
 assert.equal(projection.loopAssurance.red,4);
 assert.equal(projection.terminalControl.healthy,false);
 assert.equal(projection.terminalControl.blocked,2);
 assert.equal(projection.terminalControl.escalated,2);
 for(const gap of ['LOOP_ASSURANCE_NOT_GREEN','TERMINAL_CONTROL_PLANE_UNHEALTHY','RESULT_UNKNOWN_RECONCILIATION_REQUIRES_READBACK'])assert.ok(projection.gapCodes.includes(gap),gap);
 const html=powerhouseIntegrationMarkup(projection);
 for(const term of ['Integriteitslussen','Terminale verplichtingen','HERSTEL OPEN','rood 4','geblokkeerd 2','NIET BEWEZEN'])assert.ok(html.includes(term),term);
 assert.doesNotMatch(html,/service_role|supabase_service_key|<script\\b/i);
});
test('missing loop/terminal proof remains PARTIAL and never synthetic green',()=>{
 const x=fixture();x.readStates.loops='UNAVAILABLE';x.readStates.terminal='UNAVAILABLE';
 const p=projectPowerhouseIntegrationReadback(x);
 assert.equal(p.sourceState,'PARTIAL');
 assert.equal(p.loopAssurance,null);
 assert.equal(p.terminalControl,null);
 assert.equal(p.integrationState,'END_TO_END_UNPROVEN');
 assert.ok(p.gapCodes.includes('SOURCE_UNAVAILABLE:loops'));
 assert.ok(p.gapCodes.includes('SOURCE_UNAVAILABLE:terminal'));
 const html=powerhouseIntegrationMarkup(p);
 assert.match(html,/Geen actuele lus-readback/);
 assert.match(html,/GEEN BRON/);
});
test('client HTML escapes nontrusted provider statuses and never prints scripts',()=>{
 const x=fixture();x.datasets.loops[0].overall_status='<script>alert(1)</script>';
 const html=powerhouseIntegrationMarkup(projectPowerhouseIntegrationReadback(x));
 assert.doesNotMatch(html,/<script\\b/i);
 assert.match(html,/&lt;script&gt;/);
});
