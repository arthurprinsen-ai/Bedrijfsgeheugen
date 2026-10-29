/** Canonical ONE BRAIN learning store, injected persistent atomic adapter only. */
function atomicInserted(ack) {
  // Strict contract: only an explicit atomic conditional-insert result is authoritative.
  if (ack === true || ack?.inserted === true) return true;
  if (ack === false || ack?.inserted === false) return false;
  throw new Error('ATOMIC_STORE_ACK_REQUIRED');
}
function sameOutcome(saved, submitted) {
  return saved && saved.actionId === submitted.actionId &&
    saved.evidenceId === submitted.evidenceId && saved.result === submitted.result &&
    (saved.result !== 'VERIFIED_PAID' ||
      (saved.paymentReference === submitted.paymentReference &&
       saved.amount === submitted.amount &&
       saved.verifiedPaymentEvidence?.providerEvidenceId === submitted.verifiedPaymentEvidence?.providerEvidenceId));
}
function sameLearning(saved, submitted) {
  return saved && saved.type === submitted.type &&
    saved.segment === submitted.segment && saved.result === submitted.result &&
    saved.evidenceId === submitted.evidenceId;
}
function requireKey(value,name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`INVALID_${name}`);
  return value;
}
function component(value) { return encodeURIComponent(value).replace(/'/g, '%27'); }
async function insertFenced(store,{scope,legacyKey,key,record,matches}) {
  // One atomic persistence operation must check the active fence epoch,
  // legacy key AND v2 uniqueness in a single transaction. Never trust
  // a previous read or a callback claiming that the fence is active.
  if(typeof store.insertIfAbsentWithCutoverFence !== 'function')
    throw new Error('ATOMIC_CUTOVER_TRANSACTION_REQUIRED');
  const ack=await store.insertIfAbsentWithCutoverFence({scope,legacyKey,key,record});
  if(!ack || !['INSERTED','LEGACY_EXISTS','V2_EXISTS'].includes(ack.status) ||
     typeof ack.epoch !== 'string' || !ack.epoch.trim() ||
     ack.scope !== scope || ack.key !== key || ack.legacyKey !== legacyKey ||
     ack.transactionVerified !== true)
    throw new Error('ATOMIC_CUTOVER_ACK_REQUIRED');
  if(ack.status==='INSERTED') return {status:'RECORDED',key};
  // Independent readback remains mandatory and cannot be substituted by ack.payload.
  const saved=await store.get(ack.status==='LEGACY_EXISTS'?legacyKey:key);
  if(!matches(saved,record)) throw new Error('IDEMPOTENCY_KEY_CONFLICT_OR_UNREADABLE');
  return {status:'DUPLICATE',key:ack.status==='LEGACY_EXISTS'?legacyKey:key,legacy:ack.status==='LEGACY_EXISTS'};
}
export function makeGrowthLearningEngine(store, {verifyPayment}={}) {
 if(!store || typeof store.get!=='function' || typeof store.insertIfAbsentWithCutoverFence!=='function') throw new Error('ATOMIC_PERSISTENT_STORE_REQUIRED');
 return {
  async recordOutcome(outcome) {
   if(!outcome || !['WIN','LOSE','INCONCLUSIVE','FAILED','VERIFIED_PAID'].includes(outcome.result)) throw new Error('INVALID_OUTCOME');
   const actionId=requireKey(outcome.actionId,'ACTION_ID');
   const evidenceId=requireKey(outcome.evidenceId,'EVIDENCE_ID');
   let verifiedPaymentEvidence = null;
   if(outcome.result==='VERIFIED_PAID') {
     if (typeof verifyPayment !== 'function' || typeof outcome.paymentReference !== 'string' ||
         !outcome.paymentReference.trim() || !(Number.isFinite(outcome.amount)&&outcome.amount>0))
       throw new Error('INDEPENDENT_PAYMENT_PROOF_REQUIRED');
     // An outcome-supplied providerVerified flag is NOT trustworthy. Verify against
     // the authorized server-side payment provider before touching persistent state.
     const proof = await verifyPayment({paymentReference:outcome.paymentReference,
       actionId, evidenceId, amount:outcome.amount});
     if (proof?.verified !== true || proof.paymentReference !== outcome.paymentReference ||
         proof.amount !== outcome.amount || proof.actionId !== actionId ||
         proof.evidenceId !== evidenceId || typeof proof.providerEvidenceId !== 'string' ||
         !proof.providerEvidenceId.trim())
       throw new Error('INDEPENDENT_PAYMENT_PROOF_REQUIRED');
     verifiedPaymentEvidence={providerEvidenceId:proof.providerEvidenceId,paymentReference:proof.paymentReference,amount:proof.amount};
   }
   const legacyKey='growth:outcome:'+actionId+':'+evidenceId;
   const key='growth:outcome:v2:'+component(actionId)+':'+component(evidenceId);
   const record={...outcome,...(verifiedPaymentEvidence?{verifiedPaymentEvidence}:{}),recordedAt:new Date().toISOString(),schemaVersion:2};
   return insertFenced(store,{scope:'growth:outcome',legacyKey,key,record,matches:sameOutcome});
  },
  async getLearning(type,segment='general') {
   return (await store.get('growth:learning:'+type+':'+segment))??{experiments:0,wins:0,losses:0};
  },
  async updateLearning(type,segment,result,evidenceId) {
   if(!['WIN','LOSE','INCONCLUSIVE'].includes(result)) throw new Error('INVALID_LEARNING');
   requireKey(type,'TYPE');requireKey(segment,'SEGMENT');requireKey(evidenceId,'EVIDENCE_ID');
   const legacyKey='growth:learning-event:'+type+':'+segment+':'+evidenceId;
   const key='growth:learning-event:v2:'+component(type)+':'+component(segment)+':'+component(evidenceId);
   const record={type,segment,result,evidenceId};
   const output=await insertFenced(store,{scope:'growth:learning-event',legacyKey,key,record,matches:sameLearning});
   return output.status==='RECORDED'?{status:'RECORDED',projectionNeedsRefresh:true}:{status:'DUPLICATE',legacy:output.legacy===true};
  }
 };
}
