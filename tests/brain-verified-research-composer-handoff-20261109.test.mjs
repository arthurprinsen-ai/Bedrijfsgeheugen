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
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
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
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
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
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/from public\.powerhouse_commercial_handoff_scorecard_v1 score/);
 assert.match(sql,/handoff_health','MEASUREMENT_FAILED/);
 assert.match(sql,/original_handoff_scorecard_7d/);
 assert.match(sql,/v_handoff_scorecard->>'handoff_health'='PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE'/);
 assert.match(sql,/provider_send_forbidden',true/);
});

test('commercial closure emits measured original action funnel without manufacturing delivered emails',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
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
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
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

test('original blog queue never demotes approved content and must receive exact handoff receipt',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-blog-queue/index.ts',import.meta.url),'utf8');
 assert.match(src,/const queueStatus=clean\(o\?\.status\)==='APPROVED'\?'APPROVED':'GENERATED'/);
 assert.match(src,/p_status:queueStatus/);
 assert.match(src,/BLOG_APPROVAL_STATE_REGRESSION/);
 assert.match(src,/BLOG_ORIGINAL_QUEUE_RECEIPT_MISSING/);
 assert.match(src,/clean\(received\.status\)!==queueStatus/);
 assert.match(src,/clean\(receipt\.idempotency_key\)!==evidence\.idempotency_key/);
 assert.match(src,/clean\(receipt\.next_executor\)!==evidence\.next_executor/);
 assert.doesNotMatch(src,/p_status:'GENERATED'/);
});


test('every original content channel has a durable idempotent handoff receipt on existing hourly runner',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/create or replace function public\.powerhouse_original_handoff_receipt_audit_v1\(/i);
 assert.match(sql,/dedupe_key,event_type,source,subject_key,channel,occurred_at/);
 assert.match(sql,/'original-handoff:'\|\|r\.publication_date::text\|\|':'\|\|r\.channel/);
 assert.match(sql,/on conflict\(dedupe_key\) do update/);
 assert.match(sql,/from public\.content_publication_obligations o/);
 for(const channel of ['linkedin_personal','linkedin_company','instagram','blog'])
   assert.ok(sql.includes("'"+channel+"'"),'missing original channel '+channel);
 for(const proof of ['original_provider_proven','metric_receipt_proven','analysis_ack_proven','controlled_experiment_proven','application_ack_proven','next_natural_run_ack_proven','source_content_id','metric_source_event','expected_owner','deadline_overdue'])
   assert.ok(sql.includes("'"+proof+"'"),'missing source-bound handoff proof '+proof);
 assert.match(sql,/perform public\.powerhouse_original_handoff_receipt_audit_v1\(p_now\)/);
 assert.match(sql,/public\.powerhouse_content_closed_loop_tick_v1\(p_now timestamp with time zone DEFAULT now\(\)\)/);
 assert.match(sql,/original-content-metrics-experiment-application/);
 assert.match(sql,/from public\.powerhouse_commercial_handoff_scorecard_v1 t/);
 assert.match(sql,/revoke all on function public\.powerhouse_original_handoff_receipt_audit_v1/);
 assert.match(sql,/grant execute on function public\.powerhouse_original_handoff_receipt_audit_v1[\s\S]*?to service_role;/);
});
test('handoff receipt cannot declare complete without source measurement, experiment, applied learning and next natural provider readback',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/v_metric_proven:=r\.measured_at is not null and v_source_event is not null/);
 assert.match(sql,/v_experiment_proven:=coalesce/);
 assert.match(sql,/\{experiment,controlled_outcome_verified\}/);
 assert.match(sql,/\{learning,next_original_run_readback_verified\}/);
 assert.match(sql,/v_next_run_proven:=coalesce/);
 assert.match(sql,/and r\.learned_at is not null/);
 assert.match(sql,/elsif not v_experiment_proven then[\s\S]*?EXPERIMENT_OUTCOME_NOT_PROVEN/);
 assert.match(sql,/elsif not v_next_run_proven then[\s\S]*?NEXT_NATURAL_RUN_READBACK_MISSING/);
 assert.match(sql,/v_stage:='END_TO_END_VERIFIED'/);
 assert.match(sql,/case when v_overdue then 'error'/);
 assert.match(sql,/when v_stage='END_TO_END_VERIFIED' then 'closed'/);
 assert.match(sql,/INSUFFICIENT_EVIDENCE_NOT_LEARNED/);
 assert.doesNotMatch(sql,/create\s+(?:extension|trigger|table)\s+powerhouse_original_handoff/i);
});

test('original closure requires independently matured control and treatment, not just a claimed experiment flag',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/from public\.social_experiments se/);
 assert.match(sql,/se\.status='COMPLETE'/);
 assert.match(sql,/effect_is_causal/);
 assert.match(sql,/provider_outcome_source_event_id/);
 assert.match(sql,/control_provider_source_event_id/);
 assert.match(sql,/treatment_matured/);
 assert.match(sql,/control_matured/);
 assert.match(sql,/se\.min_steekproef/);
});
test('original applied-learning closure independently matches a later same-channel published output',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/from public\.content_publication_obligations later/);
 assert.match(sql,/later\.tenant_id=r\.tenant_id and later\.channel=r\.channel/);
 assert.match(sql,/later\.publication_date>r\.publication_date/);
 assert.match(sql,/later\.external_id=r\.evidence#>>'\{learning,next_original_provider_id\}'/);
 assert.match(sql,/later\.content_id=r\.evidence#>>'\{learning,next_original_content_id\}'/);
 assert.match(sql,/later\.content_id is distinct from r\.content_id/);
 assert.match(sql,/later\.evidence#>>'\{learning,applied_learning_id\}'/);
 assert.match(sql,/provider_publication_ack_verified/);
 assert.match(sql,/provider_truth_verified/);
});
test('single original SQL audit and original hourly tick — never duplicate by content replacement',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.equal((sql.match(/create or replace function public\.powerhouse_original_handoff_receipt_audit_v1/gi)||[]).length,1);
 assert.equal((sql.match(/create or replace function public\.powerhouse_content_closed_loop_tick_v1/gi)||[]).length,1);
 assert.match(sql,/\(se\.resultaat->>'treatment_matured'\) ~ '\^\[0-9\]\+\$'/);
 assert.match(sql,/\(se\.resultaat->>'control_matured'\) ~ '\^\[0-9\]\+\$'/);
});

test('repeated healthy cron is not downstream owner processing or fresh source progress',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/v_receipt_fingerprint:=md5\(jsonb_build_object\(/);
 assert.match(sql,/original_first_seen_at/);
 assert.match(sql,/last_real_progress_at/);
 assert.match(sql,/unchanged_heartbeat_runs/);
 assert.match(sql,/proof_fingerprint/);
 assert.match(sql,/STALLED_WITHOUT_NEW_PROOF_ESCALATE_ORIGINAL_OWNER/);
 assert.match(sql,/OVERDUE_RETURN_TO_ORIGINAL_OWNER/);
 assert.match(sql,/occurred_at=powerhouse_runtime_events\.occurred_at/);
 assert.doesNotMatch(sql,/occurred_at=excluded\.occurred_at/);
});
test('receiver must explicitly claim exact original, current owner and current proof fingerprint',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/create or replace function public\.powerhouse_claim_original_handoff_v1/);
 assert.match(sql,/p_dedupe_key not like 'original-handoff:%'/);
 assert.match(sql,/event_type='original_content_handoff_ack_audit'/);
 assert.match(sql,/for update/);
 assert.match(sql,/is distinct from p_expected_owner/);
 assert.match(sql,/is distinct from p_proof_fingerprint/);
 assert.match(sql,/RECEIVED_NOT_PROCESSED/);
 assert.match(sql,/external_provider_result_proven',false/);
 assert.match(sql,/must_verify_next_natural_run',true/);
 assert.match(sql,/revoke all on function public\.powerhouse_claim_original_handoff_v1\(/);
 assert.match(sql,/grant execute on function public\.powerhouse_claim_original_handoff_v1[\s\S]*?to service_role;/);
 assert.equal((sql.match(/create or replace function public\.powerhouse_claim_original_handoff_v1/gi)||[]).length,1);
});

test('continuous handoff assurance distinguishes missing receiver from legitimately immature metric windows',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/v_stage_actionable_at:=case/);
 assert.match(sql,/when v_stage='PROVIDER_TO_METRICS_PENDING'[\s\S]*?r\.live_proven_at\+interval '24 hours'/);
 assert.match(sql,/when v_stage='ORIGINAL_PUBLICATION_NOT_PROVEN' then v_due/);
 assert.match(sql,/when v_stage='METRICS_TO_ANALYST_ACK_MISSING'[\s\S]*?interval '4 hours'/);
 assert.match(sql,/when v_stage in \('EXPERIMENT_OUTCOME_NOT_PROVEN'/);
 assert.match(sql,/interval '8 days'/);
 assert.match(sql,/stage_execution_mature/);
 assert.match(sql,/ORIGINAL_RECEIVER_NOT_CLAIMED_ESCALATE_OWNER/);
 assert.ok(sql.includes("coalesce((powerhouse_runtime_events.evidence#>>'{handoff_receipt,next_owner_ack_claimed}')::boolean,false)=false"),'only unclaimed receipts may be escalated before outcome maturity');
 assert.match(sql,/STALLED_WITHOUT_NEW_PROOF_ESCALATE_ORIGINAL_OWNER/);
 assert.match(sql,/case when v_overdue_count>0 or v_stalled>0 then 'fout'/);
 assert.equal((sql.match(/create or replace function public\.powerhouse_original_handoff_receipt_audit_v1/gi)||[]).length,1);
});

test('original receiver claim escalation respects daily analytics and shorter original publisher cadences',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/ORIGINAL_RECEIVER_NOT_CLAIMED_ESCALATE_OWNER/);
 assert.match(sql,/excluded\.occurred_at >=[\s\S]*?last_real_progress_at/);
 assert.match(sql,/when excluded\.evidence->>'next_stage' in[\s\S]*?'PROVIDER_TO_METRICS_PENDING'/);
 assert.match(sql,/then interval '28 hours'/);
 assert.match(sql,/excluded\.channel='blog'/);
 assert.match(sql,/then interval '24 hours'/);
 assert.match(sql,/then interval '8 hours'/);
 assert.match(sql,/else interval '6 hours'/);
 assert.match(sql,/stage_execution_mature/);
 assert.match(sql,/case when v_overdue_count>0 or v_stalled>0 then 'fout'/);
});

test('only original ONE BRAIN authority can terminally close handoff; secondary hourly audit never self-promotes',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/from public\.brain_obligations original_brain/);
 for(const clause of [
  "original_brain.obligation_type='CONTENT_HANDOFF'",
  "original_brain.capability_id='content:'||r.channel",
  "original_brain.business_entity='original-provider-to-learning-chain'",
  "original_brain.business_period=r.publication_date::text",
  "original_brain.business_timezone='Europe/Amsterdam'",
  "original_brain.state='FULFILLED'",
  "original_brain.evidence->>'stage'='PROVEN_NEXT_EXPERIMENT_HANDOFF'",
  "original_brain.evidence#>>'{producer,provider_id}'=r.external_id",
  "original_brain.evidence#>>'{measurement_consumer,accepted}'",
  "original_brain.evidence#>>'{analysis_consumer,accepted}'",
  "original_brain.evidence#>>'{experiment_consumer,accepted}'",
 ])assert.ok(sql.includes(clause),'missing canonical close authority '+clause);
 assert.equal((sql.match(/ONE canonical completion authority/g)||[]).length,1);
});
