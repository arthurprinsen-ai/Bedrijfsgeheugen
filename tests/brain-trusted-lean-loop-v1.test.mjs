import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTrustedLeanLoop} from '../tools/content-growth/trusted-lean-loop.mjs';
const now=new Date('2026-10-24T10:00:00Z');
const base={
 performance:{content:{'blog:decision':{content_id:'blog:decision',content_type:'blog',events:{click:4,visit:5}}}},
 learning:{failure_diagnoses:[{content_id:'blog:decision',diagnosis:'high_click_low_conversion'}]},
 policy:{minimumSupport:3,horizonsDays:[1,3,7,30]},
 sourceIntegrity:{measurement_status:'ATTRIBUTED_EVENTS_AVAILABLE',independent_provider_metrics_confirmed:false},now
};
test('unverified events cannot yield a winner or numeric customer prediction',()=>{
 const x=buildTrustedLeanLoop(base),a=x.content_hypotheses[0];
 assert.equal(x.readiness,'NEEDS_VERIFIED_LEARNING_INPUT');
 assert.equal(a.readiness,'SOURCE_OR_SAMPLE_PROOF_REQUIRED');
 assert.equal(a.decision,'CHALLENGER_HYPOTHESIS_NOT_A_WINNER');
 assert.equal(a.customer_advisory.decision_rights.includes('Customer retains control'),true);
 assert.ok(x.forecast_status.includes('NO_NUMERIC_PROBABILITY_GENERATED'));
 assert.equal(x.proof.no_revenue_assertion_without_verified_order,true);
});
test('verified source and enough observations route only to existing bounded experiment review',()=>{
 const x=buildTrustedLeanLoop({...base,sourceIntegrity:{...base.sourceIntegrity,independent_provider_metrics_confirmed:true}});
 assert.equal(x.readiness,'READY_FOR_CANONICAL_EXPERIMENT_REVIEW');
 assert.equal(x.content_hypotheses[0].readiness,'ELIGIBLE_FOR_BOUNDED_CANONICAL_EXPERIMENT');
 assert.equal(x.mode,'READ_ONLY_ADVISORY_PROJECTION');
 assert.ok(x.content_hypotheses[0].promotion_requirements.includes('pre-registered eligible cohort and holdout'));
});
test('insufficient support or missing performance never invents an experiment',()=>{
 const x=buildTrustedLeanLoop({...base,performance:{content:{'blog:decision':{content_id:'blog:decision',events:{click:1}}}},sourceIntegrity:{independent_provider_metrics_confirmed:true}});
 assert.equal(x.readiness,'NEEDS_VERIFIED_LEARNING_INPUT');
 assert.equal(x.content_hypotheses[0].readiness,'SOURCE_OR_SAMPLE_PROOF_REQUIRED');
 const y=buildTrustedLeanLoop({...base,performance:{content:{}},learning:{failure_diagnoses:[]}});
 assert.deepEqual(y.content_hypotheses,[]);
 assert.equal(y.proof.attributed_content_count,0);
});
test('expired external market signals cannot become current customer actions',()=>{
 const x=buildTrustedLeanLoop({...base,externalResearch:[{event_id:'rvo-aanzet',source_url:'https://www.rvo.nl/',source_date:'2026-09-18',source_freshness:'DATED_SOURCE',deadline_status:'EXPIRED'}]});
 assert.equal(x.market_signal_triage[0].status,'EXPIRED_DO_NOT_PROMOTE');
 assert.equal(x.market_signal_triage[0].scope,'PUBLIC_MARKET_SIGNAL_NOT_TENANT_CONTEXT');
 assert.equal(x.proof.hypotheses_count,1);
});
test('unverified future or unlinked market signals fail closed',()=>{
 const x=buildTrustedLeanLoop({...base,externalResearch:[{event_id:'t',source_freshness:'FUTURE_OR_UNVERIFIED',deadline_status:'NOT_EXPIRED'},{event_id:'u',source_url:'javascript:evil',source_freshness:'DATED_SOURCE'}]});
 assert.deepEqual(x.market_signal_triage.map(r=>r.status),['SOURCE_VERIFICATION_REQUIRED','SOURCE_VERIFICATION_REQUIRED']);
});
test('projection is deterministic and preserves canonical runtime ownership',()=>{
 const x=buildTrustedLeanLoop(base),y=buildTrustedLeanLoop(base);
 assert.deepEqual(x,y);
 assert.deepEqual(x.content_hypotheses[0].horizons_days,[1,3,7,30]);
 assert.equal(x.existing_authorities.experiments,'public.powerhouse_experiment_decision_queue_v1');
});
