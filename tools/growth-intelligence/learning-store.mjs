/** Persistent, idempotent learning and commercial attribution contract.
 * Storage is injected by the existing Brain service, never instantiated here.
 */
export function makeGrowthLearningEngine(store) {
 if(!store || !["get","put"].every(k=>typeof store[k]==="function")) throw new Error("PERSISTENT_STORE_REQUIRED");
 return {
  async recordOutcome(outcome) {
   if(!outcome?.actionId || !outcome?.evidenceId || !["WIN","LOSE","INCONCLUSIVE","FAILED","VERIFIED_PAID"].includes(outcome.result)) throw new Error("INVALID_OUTCOME");
   if(outcome.result==="VERIFIED_PAID" && (!outcome.providerVerified || !outcome.paymentReference || !(outcome.amount>0))) throw new Error("INDEPENDENT_PAYMENT_PROOF_REQUIRED");
   const key="growth:outcome:"+outcome.actionId+":"+outcome.evidenceId;
   const existing=await store.get(key);
   if(existing) return {status:"DUPLICATE",key};
   const record={...outcome,recordedAt:new Date().toISOString(),schemaVersion:1};
   await store.put(key,record,{ifAbsent:true});
   return {status:"RECORDED",key};
  },
  async getLearning(type,segment="general") {
   return (await store.get("growth:learning:"+type+":"+segment))??{experiments:0,wins:0,losses:0};
  },
  async updateLearning(type,segment,result,evidenceId) {
   if(!["WIN","LOSE","INCONCLUSIVE"].includes(result) || !evidenceId) throw new Error("INVALID_LEARNING");
   const eventKey="growth:learning-event:"+type+":"+segment+":"+evidenceId;
   if(await store.get(eventKey)) return {status:"DUPLICATE"};
   await store.put(eventKey,{type,segment,result,evidenceId},{ifAbsent:true});
   // Event log is authoritative; projections must be rebuilt by a single writer
   // to avoid lost updates in concurrent Heartbeat workers.
   return {status:"RECORDED",projectionNeedsRefresh:true};
  }
 };
}
