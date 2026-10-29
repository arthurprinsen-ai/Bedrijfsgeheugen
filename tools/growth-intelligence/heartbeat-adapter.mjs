/**
 * Adapter contract for the EXISTING Powerhouse Brain/Heartbeat.
 * Feed only consent-aware, aggregated metrics; no credentials and no outbound actions.
 */
import {runGrowthDecisionCycle, evaluateExperiment, CRO_EXPERIMENT_CONTRACT, evaluateCroExperiment, projectCroLearning} from "./decision-core.mjs";
const ACCEPTED = Object.freeze({
 ga4:["page_dropoff","scan_abandonment","cta_underperformance"],
 search_console:["search_opportunity"],
 linkedin:["social_reply","warm_connection"],
 crm:["warm_connection","offer_stalled"],
 payments:["paid_order"]
});
export function ingestSignals(events, {now=Date.now(),maxAgeDays=30}={}) {
 if(!Array.isArray(events)) throw new TypeError("EVENTS_MUST_BE_ARRAY");
 const accepted=[],quarantined=[];
 for(const event of events){
  const kind=event?.provider, signal=event?.signal;
  if(!ACCEPTED[kind]?.includes(signal?.type)){quarantined.push({id:signal?.id??null,reason:"UNSUPPORTED_PROVIDER_SIGNAL"});continue;}
  if(!Number.isFinite(signal.observedAt)||signal.observedAt>now+300000||now-signal.observedAt>maxAgeDays*86400000){
   quarantined.push({id:signal.id??null,reason:"STALE_OR_FUTURE_SIGNAL"});continue;
  }
  if(!event.evidenceId || event.verified!==true){
   quarantined.push({id:signal.id??null,reason:"SOURCE_NOT_VERIFIED"});continue;
  }
  accepted.push({...signal,source:`${kind}:${event.evidenceId}`});
 }
 return {accepted,quarantined};
}
/** Caller persists outcomes in its existing event/learning store. */
export function heartbeatGrowthTick(input,{now=Date.now()}={}){
 const {accepted,quarantined}=ingestSignals(input.events??[],{now});
 const decisions=runGrowthDecisionCycle(accepted,{now});
 const experiments=(input.experiments??[]).map(e=>({
  id:e.id,...(e.croDesign?.contract===CRO_EXPERIMENT_CONTRACT
    ? evaluateCroExperiment(e.croDesign,e.observed||{})
    : evaluateExperiment(e))
 }));
 const croLearningProposals=(input.experiments??[]).flatMap((e,i)=>
   e.croDesign?.contract===CRO_EXPERIMENT_CONTRACT
     ? [projectCroLearning(e.croDesign,experiments[i])]
     : []);
 const croOpportunities=decisions.proposals.filter(p=>p.agent==='cro').map(p=>({
   opportunityId:p.id,owner:'cro',signalId:p.signalId,evidenceSource:p.source,
   requiredAction:'PREREGISTER_CONTEXTUAL_EXPERIMENT',status:'PROPOSED_NOT_EXECUTED',
   eligibleSurfaces:['whatsapp_prompt','progressive_form','contextual_help','exit_intent',
     'interactive_qualifier','roi_calculator','scan_followup','cta_copy'],
   nextStep:'VERIFY_BASELINE_AND_PRETREATMENT_ASSIGNMENT'
 }));
 return {
  schemaVersion:1,generatedAt:now,
  decisionId:`growth-tick:${input.cycleId??now}`,
  opportunities:decisions.proposals,
  rejected:[...quarantined,...decisions.rejected],
  experiments,
  croOpportunities,
  croLearningProposals,
  actions:decisions.proposals.map(p=>({
   id:`action:${p.id}`,owner:p.agent,kind:"DESIGN_EXPERIMENT",
   status:"PROPOSED",requiresExistingApprovalAndReadback:true,
   evidenceSource:p.source,learningKey:p.learningKey
  })),
  publishReady:false,
  revenueVerified:false
 };
}
