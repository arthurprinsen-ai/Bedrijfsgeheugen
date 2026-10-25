/**
 * Adapter contract for the EXISTING Powerhouse Brain/Heartbeat.
 * Feed only consent-aware, aggregated metrics; no credentials and no outbound actions.
 */
import {runGrowthDecisionCycle, evaluateExperiment} from "./decision-core.mjs";
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
  id:e.id,...evaluateExperiment(e)
 }));
 return {
  schemaVersion:1,generatedAt:now,
  decisionId:`growth-tick:${input.cycleId??now}`,
  opportunities:decisions.proposals,
  rejected:[...quarantined,...decisions.rejected],
  experiments,
  actions:decisions.proposals.map(p=>({
   id:`action:${p.id}`,owner:p.agent,kind:"DESIGN_EXPERIMENT",
   status:"PROPOSED",requiresExistingApprovalAndReadback:true,
   evidenceSource:p.source,learningKey:p.learningKey
  })),
  publishReady:false,
  revenueVerified:false
 };
}
