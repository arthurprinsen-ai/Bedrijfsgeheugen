/** Read-only, tenant-safe decision projection for the existing content growth learning lane.
 * Canonical experiments, predictions and outcomes stay in Supabase Brain. */
const MODES=Object.freeze({
  high_reach_low_click:{
    interpretation:'Attention without an observed next-step click. Message-match is a hypothesis, not a proven cause.',
    hypothesis:'A clearer problem-to-outcome promise may improve meaningful next-step activity.',
    change:'Test one more specific headline or content-to-CTA bridge against the incumbent.',
    leading_metric:'attributed_clicks_per_eligible_impression',
    decision_metric:'verified_qualified_leads_per_eligible_visit',
    guardrail:'no loss of qualified leads, accessibility, trust or factual accuracy'
  },
  high_click_low_conversion:{
    interpretation:'Observed clicks without attributed leads. Friction is unproven.',
    hypothesis:'Reducing mismatch between promise and landing-page next step may improve qualified progression.',
    change:'Compare a clearer, lower-friction next-step message with the unchanged incumbent.',
    leading_metric:'qualified_leads_per_attributed_visit',
    decision_metric:'verified_paid_orders_per_qualified_lead',
    guardrail:'no increase in misleading claims or involuntary contact'
  },
  leads_no_orders:{
    interpretation:'Attributed leads without orders. The sample may be immature or attribution incomplete.',
    hypothesis:'Better expectation-setting about scope, effort and fit may improve commercial progression.',
    change:'Test an evidence-backed offer-expectation section. Never invent prices, guarantees or results.',
    leading_metric:'verified_qualified_meetings_per_lead',
    decision_metric:'verified_paid_orders_per_qualified_lead',
    guardrail:'do not suppress valid leads or pressure prospects'
  }
});
const counts=['reach','impression','engagement','click','visit','cta','lead','qualified_lead','opportunity','order','revenue'];
const count=v=>Number.isFinite(Number(v))&&Number(v)>=0?Number(v):0;
const horizonDays=xs=>[...new Set(xs.filter(v=>Number.isInteger(v)&&v>=1&&v<=90))].sort((a,b)=>a-b);

/** This reads aggregate content observations only. No global source is promoted
 * to authenticated customer context, forecast truth or executed experiment. */
export function buildTrustedLeanLoop({performance={},learning={},externalResearch=[],sourceIntegrity={},policy={},now=new Date()}={}){
  const date=now instanceof Date?now:new Date(now);
  if(Number.isNaN(date.getTime()))throw new TypeError('LEAN_INVALID_CLOCK');
  if(!Array.isArray(externalResearch))throw new TypeError('LEAN_RESEARCH_MUST_BE_ARRAY');
  const minimumSupport=Math.max(3,Math.floor(Number(policy.minimumSupport)||3));
  const horizons=horizonDays(Array.isArray(policy.horizonsDays)?policy.horizonsDays:[1,3,7,30]);
  const providerVerified=sourceIntegrity?.independent_provider_metrics_confirmed===true;
  const content=performance?.content||{};
  const entries=Object.values(content).filter(x=>x&&typeof x==='object').sort((a,b)=>String(a.content_id).localeCompare(String(b.content_id)));
  const seenIds=new Set();
  const candidates=[];
  for(const bucket of entries){
    const id=String(bucket.content_id||'');
    if(!id||seenIds.has(id))continue;
    seenIds.add(id);
    const diag=learning?.failure_diagnoses?.find(x=>x.content_id===id)?.diagnosis;
    const recipe=MODES[diag];
    if(!recipe)continue;
    const measures=Object.fromEntries(counts.map(k=>[k,count(bucket.events?.[k])]));
    const support=Object.values(measures).reduce((a,b)=>a+b,0);
    const readiness=providerVerified&&support>=minimumSupport?'ELIGIBLE_FOR_BOUNDED_CANONICAL_EXPERIMENT':'SOURCE_OR_SAMPLE_PROOF_REQUIRED';
    candidates.push({
      fingerprint:'lean-content|'+id+'|'+diag,
      evidence_scope:'PUBLIC_AGGREGATE_CONTENT_ONLY',
      content_id:id,content_type:String(bucket.content_type||'unknown'),diagnosis:diag,
      observation:recipe.interpretation,hypothesis:recipe.hypothesis,
      minimum_distinct_attributed_events:minimumSupport,observed_event_records:support,
      measures,
      counterfactual:'Attribution delay, seasonality, channel mix or sampling noise may explain this pattern.',
      proposed_small_change:recipe.change,primary_metric:recipe.decision_metric,
      diagnostic_metric:recipe.leading_metric,guardrail:recipe.guardrail,
      horizons_days:horizons,decision:'CHALLENGER_HYPOTHESIS_NOT_A_WINNER',
      readiness,
      action_authority:'existing canonical experiment decision and protected publisher; no direct mutation',
      promotion_requirements:['verified independent source','pre-registered eligible cohort and holdout','minimum sample and matured outcome window','no guardrail regression','independent production readback'],
      customer_advisory:{
        facts:'Aggregate content-event records only; no individual customer goal or outcome inferred.',
        assumptions:['Tracking coverage is sufficient for a valid comparison; must verify.'],
        uncertainty:'No proven causal lift or per-customer prediction.',
        alternatives:['retain_incumbent','research_attribution','bounded_challenger_if_authorized'],
        conflict_of_interest:'Publication or lead volume benefits the vendor; stakeholder value takes priority.',
        decision_rights:'Customer retains control of their own business decisions; personal context needs authenticated tenant evidence.'
      }
    });
  }
  const research=externalResearch.map(x=>{
    const expiry=x?.deadline_status;
    const freshness=x?.source_freshness;
    const validSource=typeof x?.source_url==='string'&&/^https?:\/\//.test(x.source_url);
    const status=!validSource||freshness!=='DATED_SOURCE'?'SOURCE_VERIFICATION_REQUIRED':expiry==='EXPIRED'?'EXPIRED_DO_NOT_PROMOTE':'RESEARCH_ONLY_VERIFY_RELEVANCE';
    return {
      signal_id:String(x?.event_id||'unknown'),source_url:validSource?x.source_url:null,
      source_date:x?.source_date||null,deadline_status:expiry||'UNKNOWN',status,
      scope:'PUBLIC_MARKET_SIGNAL_NOT_TENANT_CONTEXT',
      hypothesis:'Investigate whether the change materially affects a documented customer job, decision or budget.',
      evidence_before_action:['verify current authoritative source','check dates and applicability','confirm customer relevance and consent','map canonical owner and safe action'],
      unearned_claims_forbidden:true
    };
  });
  const readiness=candidates.some(x=>x.readiness==='ELIGIBLE_FOR_BOUNDED_CANONICAL_EXPERIMENT')?'READY_FOR_CANONICAL_EXPERIMENT_REVIEW':'NEEDS_VERIFIED_LEARNING_INPUT';
  return {
    contract:'POWERHOUSE-TRUSTED-LEAN-LOOP-v1',produced_at:date.toISOString(),
    decision_scope:'market-level anonymous aggregate; no person-level or cross-tenant inference',
    mode:'READ_ONLY_ADVISORY_PROJECTION',
    existing_authorities:{
      experiments:'public.powerhouse_experiment_decision_queue_v1',
      experiment_learning:'public.powerhouse_experiment_learning_v2',
      predictions:'public.powerhouse_prediction_intelligence_control_v2',
      forecasts:'public.powerhouse_forecast_quality_v2',
      outcome_memory:'public.powerhouse_outcome_memory_v1',
      trusted_advisor:'config/trusted-advisor-os.json'
    },
    lean_cycle:['observe','hypothesize','minimum_reversible_test','measure_verified_outcomes','compare_holdout','learn','scale_or_rollback'],
    readiness,
    proof:{
      provider_readback_verified:providerVerified,
      source_measurement_status:sourceIntegrity?.measurement_status||'UNKNOWN',
      attributed_content_count:entries.length,hypotheses_count:candidates.length,
      no_causal_or_numeric_customer_predictions_without_calibration:true,
      no_revenue_assertion_without_verified_order:true
    },
    content_hypotheses:candidates.slice(0,5),
    market_signal_triage:research.slice(0,10),
    customer_discovery_questions:[
      'Which recurring decision is slowed by missing or conflicting operational evidence?',
      'What will the customer count as success: time, risk, quality or independently verified financial value?',
      'What evidence would make the customer reject our proposed solution?'
    ],
    forecast_status:'USE_EXISTING_CANONICAL_CALIBRATION_ONLY; NO_NUMERIC_PROBABILITY_GENERATED',
    trusted_advisor_rule:'Recommend doing nothing or investigating when evidence is insufficient; disclose alternatives, limitations, conflicts and next readback.',
    next_step:readiness==='READY_FOR_CANONICAL_EXPERIMENT_REVIEW'?'route qualified candidate through existing experiment/publisher guardrails':'obtain independently verified GA4/GSC/social, order and customer-goal evidence before winner promotion'
  };
}
