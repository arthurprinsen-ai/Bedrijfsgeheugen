import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceVerifiedComposerHandoff} from '../supabase/functions/_shared/verified-research-composer-handoff.mjs';
const now='2026-11-09T12:30:00.000Z';
const a={action_id:'8ebbec50-0522-4919-b9f0-239946884d48',person_key:'person-1',company_key:'company-1',company_name:'ROXTAR Online Marketing',source_url:'https://www.linkedin.com/in/example',message_plan:{play_key:'trigger_outreach',human_readable_context:false,source_trigger_relevance:false},evidence:{execution_gate:{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}}};
const url='https://www.nationalevacaturebank.nl/vacatures/werkgever/roxtar-online-marketing';
const r={action_id:'67da3cc6-2737-4bea-8b1c-39e022da50f7',status:'done',person_key:a.person_key,company_key:a.company_key,source_url:url,executed_at:'2026-11-09T07:05:00Z',evidence:{original_outreach_action_id:a.action_id,public_research_execution:{contract:'powerhouse-relationship-research-auto-enrichment-v1',source_url:url}}};
const n={url,bedrijf:a.company_name,titel:'5 vacatures bij ROXTAR Online Marketing op 31 oktober',haak:'ROXTAR Online Marketing plaatste vijf vacatures, waaronder voor SEO en new business.',over_dit_bedrijf:true,afgewezen_reden:null,zekerheid:95,gepubliceerd_op:'2026-11-01T06:00:00Z',opgehaald_op:'2026-11-07T06:31:00Z'};
test('converts independently vetted canonical company news into original composer context, not send proof',()=>{
 const x=sourceVerifiedComposerHandoff(a,r,n,now); assert.ok(x);
 assert.equal(x.source_url,url);
 assert.equal(x.message_plan.human_readable_context,true);
 assert.equal(x.message_plan.source_trigger_relevance,true);
 assert.equal(x.evidence.public_source_evidence.evidence.headline,n.titel);
 assert.equal(x.evidence.verified_research_composer_handoff.provider_send_executed,false);
 assert.equal(x.evidence.verified_research_composer_handoff.quality_approved,false);
 assert.equal(x.evidence.execution_gate.reason,'SOURCE_SPECIFIC_EVIDENCE_REQUIRED');
 assert.equal(a.message_plan.human_readable_context,false);
});
test('research cannot be borrowed from a different prospect or company',()=>{
 assert.equal(sourceVerifiedComposerHandoff(a,{...r,person_key:'other'},n,now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,{...r,company_key:'other'},n,now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,r,{...n,bedrijf:'Different company'},now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,{...r,evidence:{...r.evidence,original_outreach_action_id:'some-other-action'}},n,now),null);
});
test('unverified, rejected or stale source never unlocks commercial message',()=>{
 assert.equal(sourceVerifiedComposerHandoff(a,r,{...n,over_dit_bedrijf:false},now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,r,{...n,afgewezen_reden:'wrong_company'},now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,r,{...n,gepubliceerd_op:'2025-01-01T00:00:00Z'},now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,r,{...n,zekerheid:0.3},now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,r,{...n,url:'http://localhost/private'},now),null);
});
test('research candidates, no-result attempts and outdated execution cannot send',()=>{
 assert.equal(sourceVerifiedComposerHandoff(a,{...r,status:'waiting'},n,now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,{...r,executed_at:'2026-10-01T00:00:00Z'},n,now),null);
 assert.equal(sourceVerifiedComposerHandoff(a,{...r,evidence:{...r.evidence,public_research_execution:{contract:'powerhouse-relationship-public-research-v1',source_url:url}}},n,now),null);
 assert.equal(sourceVerifiedComposerHandoff({...a,evidence:{execution_gate:{reason:'OTHER_HOLD'}}},r,n,now),null);
});

test('production composer consumes verified original research before its original source quality gate',()=>{
 const text=readFileSync(new URL('../supabase/functions/powerhouse-commercial-message-composer/index.ts',import.meta.url),'utf8');
 assert.match(text,/sourceVerifiedComposerHandoff\(workingAction,research,news,now\)/);
 assert.match(text,/const sourceGate=composerSourcePreflight\(workingAction,workingAction\.message_plan\)/);
 assert.match(text,/const evidence=\{\.\.\.\(workingAction\.evidence\|\|\{\}\),commercial_intelligence:ci\}/);
});

test('research-bound waiting retains original action and never authorizes a provider send',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261109144500_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/WAIT_FOR_VERIFIED_SOURCE/);
 assert.match(sql,/a\.created_at>p_now-interval '48 hours'/);
 assert.match(sql,/EXPIRE_AFTER_RESEARCH_WINDOW/);
 assert.match(sql,/r\.dedupe_key='relationship-research:outreach-source:'\|\|a\.action_id::text/);
 assert.match(sql,/r\.person_key=a\.person_key/);
 assert.match(sql,/r\.company_key=a\.company_key/);
 assert.match(sql,/and coalesce\(a\.evidence#>>'\{execution_gate,reason\}',''\) <> 'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'/);
 assert.match(sql,/awaiting_verified_source/);
 assert.match(sql,/v_held_research>0 then 'waarschuwing'/);
 assert.doesNotMatch(sql,/create\s+(?:table|extension|trigger)/i);
});
test('existing composer is sole authority to resume source-held waiting email',()=>{
 const ts=readFileSync(new URL('../supabase/functions/powerhouse-commercial-message-composer/index.ts',import.meta.url),'utf8');
 assert.match(ts,/if\(action\.status==='waiting' &&/);
 assert.match(ts,/workingAction\?\.evidence\?\.verified_research_composer_handoff\?\.contract==='POWERHOUSE_VERIFIED_RESEARCH_COMPOSER_HANDOFF_V1'/);
 assert.match(ts,/qv\.checks\.source_specific_evidence_ok===true/);
 assert.match(ts,/qv\.checks\.semantic_novelty_ok===true/);
 assert.match(ts,/update\.status='prepared';update\.due_at=now/);
 assert.match(ts,/reason:'SOURCE_VERIFIED_COMPOSER_ACCEPTED'/);
 assert.match(ts,/provider_attempted:false,provider_readback_verified:false/);
});

test('canonical per-action handoff telemetry has original identifiers, SLA and provider evidence',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261109144500_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/create or replace view public\.powerhouse_commercial_handoff_telemetry_v1/);
 assert.match(sql,/create or replace view public\.powerhouse_commercial_handoff_scorecard_v1/);
 assert.match(sql,/with \(security_invoker = true\) as/);
 assert.match(sql,/revoke all on table public\.powerhouse_commercial_handoff_telemetry_v1 from public,anon,authenticated/);
 assert.match(sql,/revoke all on table public\.powerhouse_commercial_handoff_scorecard_v1 from public,anon,authenticated/);
 assert.match(sql,/grant select on table public\.powerhouse_commercial_handoff_scorecard_v1 to service_role/);
 assert.match(sql,/r\.dedupe_key='relationship-research:outreach-source:'\|\|a\.action_id::text/);
 assert.match(sql,/r\.person_key is not distinct from a\.person_key/);
 assert.match(sql,/r\.company_key is not distinct from a\.company_key/);
 assert.match(sql,/q\.action_id=a\.action_id/);
 assert.match(sql,/j\.latest_quality_evaluated_at>=j\.research_completed_at/);
 assert.match(sql,/BROKEN_RESEARCH_TO_COMPOSER_EXPIRED/);
 assert.match(sql,/BROKEN_RESEARCH_TO_COMPOSER_SLA/);
 assert.match(sql,/COMPOSER_TO_PROVIDER_UNPROVEN/);
 assert.match(sql,/PROVIDER_READBACK_MISSING/);
 assert.match(sql,/EXPIRED_WITHOUT_DELIVERY/);
 assert.match(sql,/provider_message_id is not null and j\.provider_ack_observed and j\.provider_readback_observed/);
 assert.match(sql,/provider_linked_replies_7d/);
 assert.match(sql,/provider_linked_realized_revenue_eur_7d/);
 assert.match(sql,/provider_delivery_proven\),0\)::numeric/);
 assert.match(sql,/NO_ELIGIBLE_ACTIONS_OBSERVED/);
 assert.doesNotMatch(sql,/create\s+table\s+public\.powerhouse_commercial_handoff/i);
});
test('the original existing email watchdog runs handoff measurement every natural owner tick',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261109144500_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/from public\.powerhouse_commercial_handoff_scorecard_v1 score/);
 assert.match(sql,/handoff_health','MEASUREMENT_FAILED/);
 assert.match(sql,/original_handoff_scorecard_7d/);
 assert.match(sql,/v_handoff_scorecard->>'handoff_health'='PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE'/);
 assert.match(sql,/provider_send_forbidden',true/);
});

test('commercial closure emits measured original action funnel without manufacturing delivered emails',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261109144500_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/POWERHOUSE_ORIGINAL_COMMERCIAL_HANDOFF_MEASUREMENT_V1/);
 for(const field of [
  'linked_original_research_7d','research_done_with_source_7d',
  'research_done_but_original_expired_7d','composer_evaluated_7d',
  'research_done_without_composer_evaluation_7d',
  'last_composer_quality_passed_7d','provider_ack_with_external_message_id_7d',
  'provider_readback_with_external_message_id_7d','provider_linked_reply_7d',
  'research_to_composer_evaluation_pct','handoff_problem',
  'experiment_evidence_state'
 ])assert.ok(sql.includes("'"+field+"'"),'missing original funnel field '+field);
 assert.match(sql,/a\.created_at>=p_now-interval '7 days'/);
 assert.match(sql,/r\.person_key=a\.person_key/);
 assert.match(sql,/r\.company_key=a\.company_key/);
 assert.match(sql,/order by q\.evaluated_at desc limit 1/);
 assert.match(sql,/status='done' and executed_at is not null and provider_ack and provider_readback and external_id is not null/);
 assert.match(sql,/provider_linked_reply_7d/);
 assert.match(sql,/INSUFFICIENT_EVIDENCE_NOT_LEARNED/);
 assert.match(sql,/v_payload:=v_payload \|\| jsonb_build_object\(/);
 assert.match(sql,/insert into public\.bg_gezondheid/);
});
test('experiment readiness is policy-scoped and not called learned without two mature arms',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261109144500_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/from public\.powerhouse_experiment_policies/);
 assert.match(sql,/experiment_key='persuasion-revenue-optimizer-v1' and status='active'/);
 assert.match(sql,/where experiment_key='persuasion-revenue-optimizer-v1'/);
 assert.match(sql,/v_matured_treatment_30d>=v_experiment_min_per_arm/);
 assert.match(sql,/v_matured_holdout_30d>=v_experiment_min_per_arm/);
 assert.match(sql,/NO_ACTIVE_EXPERIMENT_POLICY/);
 assert.match(sql,/INSUFFICIENT_EVIDENCE_NOT_LEARNED/);
});
