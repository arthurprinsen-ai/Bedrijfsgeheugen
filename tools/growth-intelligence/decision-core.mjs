/**
 * Powerhouse Growth Intelligence: deterministic, consent-aware decision kernel.
 * This is a library called by the EXISTING Brain/Heartbeat, never a scheduler.
 * No production actions are executed by this module.
 */
export const LOOP_VERSION = "1.0.0";
const clamp = (n,min,max) => Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
const ALLOWED = new Set(["page_dropoff","scan_abandonment","cta_underperformance","search_opportunity","social_reply","warm_connection","offer_stalled","paid_order"]);
const PLAYBOOK = {
  page_dropoff: ["cro","Audit page friction and propose a mobile-first CTA experiment"],
  scan_abandonment: ["cro","Test shorter scan completion and explicit voluntary follow-up"],
  cta_underperformance: ["cro","Test evidence-led CTA copy with stable assignment"],
  search_opportunity: ["seo","Create a differentiated intent-matched landing-page proposal"],
  social_reply: ["relationship","Review the response and prepare relevant, human-appropriate follow-up"],
  warm_connection: ["sales","Qualify business fit and prepare consent-compliant outreach"],
  offer_stalled: ["sales","Check the legitimate next follow-up step and blockers"],
  paid_order: ["revenue","Reconcile independent payment evidence and source attribution"]
};
const requiresApproval = new Set(["send_message","publish_content","deploy_code","change_price","process_payment"]);
export function validateSignal(s) {
  if(!s || typeof s !== "object" || !ALLOWED.has(s.type)) throw new Error("INVALID_SIGNAL_TYPE");
  if(typeof s.id !== "string" || !s.id.trim()) throw new Error("MISSING_SIGNAL_ID");
  if(typeof s.source !== "string" || !s.source.trim()) throw new Error("MISSING_EVIDENCE_SOURCE");
  if(!Number.isFinite(s.observedAt) || s.observedAt <= 0) throw new Error("INVALID_OBSERVED_AT");
  if(s.containsPersonalData === true && s.consentOrBasisVerified !== true) throw new Error("PERSONAL_DATA_GUARD");
  return s;
}
export function scoreOpportunity(s, now=Date.now()) {
  validateSignal(s);
  const impact=clamp(s.estimatedIncrementalMargin,0,1_000_000);
  const confidence=clamp(s.confidence,0,1);
  const cost=clamp(s.effortHours,1,1000);
  const risk=clamp(s.risk,0,1);
  const staleDays=Math.max(0,(now-s.observedAt)/86400000);
  const freshness=1/(1+staleDays/14);
  const dataQuality=clamp(s.dataQuality,0,1);
  return Number((impact*confidence*dataQuality*freshness*(1-risk)/(cost+2)).toFixed(4));
}
export function proposeImprovement(signal, opts={}) {
  const now=opts.now ?? Date.now();
  const score=scoreOpportunity(signal,now);
  const [agent,hypothesis]=PLAYBOOK[signal.type];
  const requiresConsent = signal.type==="warm_connection" || signal.type==="social_reply" || signal.type==="offer_stalled";
  return {
    id:`growth:${signal.id}`, signalId:signal.id, agent, source:signal.source,
    hypothesis, score, status:"PROPOSED",
    nextStep:"EXPERIMENT_DESIGN",
    guardrails:{noUnsolicitedMessaging:requiresConsent,noAutomatedDeployment:true,
      protectPrivacy:true,providerReadbackRequired:true,independentPaymentProofRequired:true},
    primaryMetric:signal.type==="paid_order"?"verified_paid_margin":"qualified_leads_to_paid_orders",
    evidence:{observedAt:signal.observedAt,baseline:signal.baseline??null},
    learningKey:`growth-learning:${signal.type}:${signal.segment??"general"}`
  };
}
export function decideExecution(proposal, action, evidence={}) {
  if(!proposal || proposal.status!=="PROPOSED") return {allowed:false,reason:"NOT_PROPOSED"};
  if(requiresApproval.has(action) && evidence.approved!==true) return {allowed:false,reason:"APPROVAL_REQUIRED"};
  if(["send_message"].includes(action) && (evidence.legitimateContactBasis!==true || evidence.unsubscribed===true))
    return {allowed:false,reason:"CONTACT_BASIS_REQUIRED"};
  if(["publish_content","deploy_code"].includes(action) && evidence.requiredChecksPassed!==true)
    return {allowed:false,reason:"REQUIRED_CHECKS_NOT_PASSED"};
  if(action==="record_revenue" && !(evidence.paymentProviderVerified===true && typeof evidence.paymentReference==="string" && evidence.paymentReference.length>0))
    return {allowed:false,reason:"PAYMENT_EVIDENCE_REQUIRED"};
  if(action==="record_publication" && !(evidence.providerReadback===true && evidence.publicId))
    return {allowed:false,reason:"PUBLICATION_READBACK_REQUIRED"};
  return {allowed:true,reason:"SAFE_TO_HAND_OFF"};
}
export function evaluateExperiment(experiment) {
  if(!experiment || !experiment.id || !experiment.primaryMetric) throw new Error("INVALID_EXPERIMENT");
  if(experiment.sampleRatioMismatch===true) return {status:"INVALID",reason:"SAMPLE_RATIO_MISMATCH"};
  if(experiment.guardrailRegression===true) return {status:"STOP",reason:"GUARDRAIL_REGRESSION"};
  if(!experiment.preRegistered || !Number.isFinite(experiment.pValue) || !Number.isFinite(experiment.effect) ||
    (experiment.sampleSize??0)<(experiment.minimumSampleSize??Infinity))
    return {status:"INCONCLUSIVE",reason:"INSUFFICIENT_VALID_EVIDENCE"};
  if(experiment.pValue>0.05) return {status:"INCONCLUSIVE",reason:"NOT_STATISTICALLY_CONCLUSIVE"};
  return {status:experiment.effect>0?"WIN":"LOSE",reason:"REGISTER_LEARNING_NOT_AUTOMATIC_DEPLOYMENT"};
}
export function runGrowthDecisionCycle(signals,{now=Date.now(),limit=10}={}) {
  if(!Array.isArray(signals)) throw new Error("SIGNALS_MUST_BE_ARRAY");
  const ids=new Set(),rejected=[],proposals=[];
  for(const signal of signals) {
    try {
      validateSignal(signal);
      if(ids.has(signal.id)) {rejected.push({id:signal.id,reason:"DUPLICATE_SIGNAL"});continue;}
      ids.add(signal.id);
      proposals.push(proposeImprovement(signal,{now}));
    } catch(e) {rejected.push({id:signal?.id??null,reason:e.message});}
  }
  proposals.sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
  return {version:LOOP_VERSION,generatedAt:now,proposals:proposals.slice(0,clamp(limit,0,100)),rejected,
    summary:{observed:signals.length,accepted:proposals.length,rejected:rejected.length},
    note:"Advisory only: existing Heartbeat executes gated actions and independent readback."};
}
