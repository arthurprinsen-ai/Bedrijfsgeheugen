import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('internal cockpit endpoint is basic-auth protected and uses existing Edge trust boundary',async()=>{
 const fn=await readFile('netlify/functions/powerhouse-control-plane-cockpit.mjs','utf8');
 assert.match(fn,/basicAuthMatches/);
 assert.match(fn,/INTERN_GEBRUIKER/);
 assert.match(fn,/INTERN_WACHTWOORD/);
 assert.match(fn,/BG_PORTAL_EU_SUPABASE_URL/);
 assert.match(fn,/BG_PORTAL_EU_SERVICE_TOKEN/);
 assert.match(fn,/action:'control_plane_cockpit'/);
 assert.doesNotMatch(fn,/SUPABASE_SERVICE_ROLE_KEY/);
});

test('Edge cockpit reads only canonical control-plane projections',async()=>{
 const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
 assert.match(edge,/powerhouse_obligation_cockpit_v1/);
 assert.match(edge,/powerhouse_control_plane_metrics_v1/);
 assert.match(edge,/action==='control_plane_cockpit'/);
 assert.doesNotMatch(edge,/control_plane_cockpit[\s\S]{0,5000}select\('\*'\)/);
});

test('cockpit payload exposes decision proof not raw evidence payloads',async()=>{
 const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
 for(const field of ['requested_goal','current_state','proof','blocker','next_action','actual_result'])assert.match(edge,new RegExp(field));
 const action=edge.slice(edge.indexOf("if(action==='control_plane_cockpit')"),edge.indexOf("if(action==='learning_export')"));
 assert.doesNotMatch(action,/operation_evidence|obligation_evidence|payload:/);
});

test('internal UI renders exactly the operator decision flow',async()=>{
 const html=await readFile('intern/control-plane/index.html','utf8');
 for(const text of ['Powerhouse Control Plane','Bewijs','Blokkade:','Volgende automatische actie:','Resultaat:'])assert.match(html,new RegExp(text));
 assert.match(html,/\/api\/powerhouse\/control-plane\/cockpit/);
 assert.match(html,/False-success risico/);
 assert.match(html,/First-time-right/);
});
