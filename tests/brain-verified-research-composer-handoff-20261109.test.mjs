import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileOriginalPublicationMeasurement,identifyOriginalPublicationHandoff} from '../supabase/functions/_shared/original-publication-metric-handoff.mjs';
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
 assert.match(sql,/when v_held_research>0/);
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

test('canonical skill makes publication only a nonterminal step until applied learning is read back',()=>{
 const body=readFileSync(new URL('../.agents/skills/powerhouse-relationship-external-intelligence/SKILL.md',import.meta.url),'utf8');
 for(const clause of ['P0_END_TO_END_CLOSURE_20261109','content_publication_obligations','powerhouse_sales_actions','ONE BRAIN/Heartbeat','LIVE_PROVEN','MEASUREMENT_PENDING','ANALYSIS_PENDING','EXPERIMENT_PENDING','APPLICATION_PENDING','INSUFFICIENT_EVIDENCE_NOT_LEARNED','NOT_ELIGIBLE','provider-ID/URL','volgende NATUURLIJKE productie-run']) assert.ok(body.includes(clause),'missing hard acceptance '+clause);
 assert.match(body,/Geen tweede executor, cron, CRM, databank of losse leertaak/);
 assert.match(body,/alleen werkelijke provider-ID\+readback/);
});


const measuredPersonal={
 tenant_id:'canonical',publication_date:'2026-11-08',channel:'linkedin_personal',
 status:'LIVE_PROVEN',external_id:'urn:li:share:7525096824584544257',
 published_at:'2026-11-08T07:28:13.735Z',live_proven_at:'2026-11-08T07:29:30.803Z',
 measured_at:null,learned_at:null,metrics:{}
};
const personalPost={tenant_id:'canonical',post_id:'linkedin-personal:7525096824584544257',
 external_post_id:measuredPersonal.external_id,channel_kind:'linkedin_personal',published_at:measuredPersonal.published_at};
const personalSnapshot={tenant_id:'canonical',post_id:personalPost.post_id,
 source:'composio-linkedin',data_quality:'OBSERVED_PARTIAL_SCOPE',
 observed_at:'2026-11-09T15:32:45.977Z',
 source_event_id:'composio:linkedin:urn:li:share:7525096824584544257:2026-11-09',
 metrics:{reactions:8,metric_scope:'reactions_only',views_unavailable:true}};
const measurementTime='2026-11-09T16:00:00Z';

test('original personal post receives only independently source-bound mature reactions, no invented reach or learning',()=>{
 const r=identifyOriginalPublicationHandoff(measuredPersonal,[personalPost],[personalSnapshot],measurementTime);
 assert.equal(r.reason,'VERIFIED_MATURED_PROVIDER_METRIC');
 assert.equal(r.patch.measured_at,personalSnapshot.observed_at);
 assert.equal(r.patch.status,'LIVE_PROVEN');
 assert.equal(r.patch.learned_at,null);
 assert.deepEqual(r.patch.metrics.original_provider_metric_handoff.observed_metrics,{reactions:8});
 assert.equal(r.patch.metrics.original_provider_metric_handoff.impression_source_available,false);
 assert.equal(r.patch.metrics.original_provider_metric_handoff.enough_for_commercial_or_causal_learning,false);
 const already={...measuredPersonal,metrics:r.patch.metrics,measured_at:r.patch.measured_at};
 assert.equal(identifyOriginalPublicationHandoff(already,[personalPost],[personalSnapshot],measurementTime).reason,'ALREADY_RECONCILED');
});
test('reject source spoofing, wrong post identity, missing independent provider evidence and immature snapshots',()=>{
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,{...personalPost,external_post_id:'urn:li:share:111'},personalSnapshot,measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,{...personalPost,tenant_id:'other'},personalSnapshot,measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,personalPost,{...personalSnapshot,source:'generated'},measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,personalPost,{...personalSnapshot,data_quality:'INFERRED'},measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,personalPost,{...personalSnapshot,metrics:{reactions:0}},measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,personalPost,{...personalSnapshot,source_event_id:'composio:linkedin:urn:li:share:999:2026-11-09'},measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(measuredPersonal,personalPost,{...personalSnapshot,observed_at:'2026-11-08T14:30:00Z'},measurementTime),null);
 assert.equal(identifyOriginalPublicationHandoff(measuredPersonal,[personalPost,personalPost],[personalSnapshot],measurementTime).reason,'AMBIGUOUS_POST_IDENTITY');
});
test('company snapshot requires exact independently verified organization author and impressions',()=>{
 const ob={...measuredPersonal,channel:'linkedin_company',tenant_id:'canonical',external_id:'urn:li:share:7524367540987301888',
  published_at:'2026-11-06T07:10:19.789Z',live_proven_at:'2026-11-06T07:10:19.789Z'};
 const post={tenant_id:'bedrijfsgeheugen',post_id:'linkedin-company:'+ob.external_id,
   channel_kind:'linkedin_company',external_post_id:ob.external_id,published_at:ob.published_at};
 const snap={tenant_id:'bedrijfsgeheugen',post_id:post.post_id,source:'windsor-linkedin-company',
   data_quality:'PROVIDER_OBSERVED_LINKED',observed_at:'2026-11-08T14:27:03.278Z',
   source_event_id:'windsor:linkedin-company:'+ob.external_id+':2026-11-08',
   metrics:{scope:'company_post_analytics',provider_post_urn:ob.external_id,
    provider_organization_urn:'urn:li:organization:18234216',
    independent_proof:'EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT',
    impressions:183,likes:1,clicks:0,comments:0}};
 const r=reconcileOriginalPublicationMeasurement(ob,post,snap,measurementTime);
 assert.ok(r);
 assert.equal(r.metrics.original_provider_metric_handoff.observed_metrics.impressions,183);
 assert.equal(r.metrics.original_provider_metric_handoff.observed_metrics.clicks,0);
 assert.equal(r.metrics.original_provider_metric_handoff.measurement_scope,'company_post_analytics');
 assert.equal(r.learned_at,null);
 assert.equal(reconcileOriginalPublicationMeasurement(ob,post,{...snap,metrics:{...snap.metrics,provider_organization_urn:'urn:li:organization:other'}},measurementTime),null);
 assert.equal(reconcileOriginalPublicationMeasurement(ob,post,{...snap,data_quality:'UNVERIFIED'},measurementTime),null);
});
test('the original six-hour provider reader is sole write owner; write is original conditional compare-and-swap',()=>{
 const ts=readFileSync(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
 assert.match(ts,/identifyOriginalPublicationHandoff\(ob,\[post\],snapshots\|\|\[\],now\.toISOString\(\)\)/);
 assert.match(ts,/\.from\('content_publication_obligations'\)/);
 assert.match(ts,/\.eq\('status','LIVE_PROVEN'\)\.eq\('updated_at',ob\.updated_at\)/);
 assert.match(ts,/measured_at:result\.patch\.measured_at/);
 assert.match(ts,/original_publication_metric_handoff:originalMetricHandoff/);
 assert.match(ts,/learning_proven:false/);
 assert.doesNotMatch(ts,/await db\.from\('content_publication_obligations'\)\.insert\(/);
});
