// Existing ONE BRAIN repair register -> read-only, fail-closed recovery proof audit.
// Advisory only: a database self-report cannot replace external provider verification.
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const nonEmpty = value => typeof value === 'string' && value.trim().length >= 3;
const finiteTime = value => validDate(value) ? Date.parse(value) : null;
const required = ['CAUSE_DOCUMENTED','FIX_DOCUMENTED','PREVENTION_DOCUMENTED','REGRESSION_REFERENCE',
  'PRODUCTION_PROVIDER_READBACK','NEXT_NATURAL_AGENT_RUN','INDEPENDENT_RESULT_READBACK',
  'LATER_RECURRENCE_CHECK'];
const empty = reason => ({
  contract:'POWERHOUSE_ONE_BRAIN_RECOVERY_CLOSURE_AUDIT_V1',status:'UNVERIFIED',
  reason,sourceReadbackVerified:false,independentlyVerified:false,rowsInspected:0,
  recordedProofCandidates:0,cases:[],required
});
export function projectRecoveryClosureAudit(rows,{sourceState='UNAVAILABLE',at=new Date().toISOString()}={}) {
  const now=finiteTime(at);
  if(sourceState!=='LIVE'||!Array.isArray(rows))return empty('ORIGINAL_FAILURE_REGISTER_UNAVAILABLE');
  if(now===null||rows.length>20)return empty('INVALID_CLOCK_OR_TRUNCATED_REGISTER');
  const cases=[];
  for(const row of rows) {
    if(!row || !nonEmpty(row.fingerprint))return empty('FAILURE_IDENTITY_UNVERIFIED');
    const seen=finiteTime(row.last_seen_at);
    if(seen===null||seen>now+300000)return empty('INCIDENT_OBSERVATION_TIME_INVALID');
    const ev=row.evidence && typeof row.evidence==='object'&&!Array.isArray(row.evidence)?row.evidence:{};
    const proof=ev.recovery_closure_v1 && typeof ev.recovery_closure_v1==='object'?
      ev.recovery_closure_v1:{};
    const prod=proof.production||{},next=proof.naturalRun||{},
      outcome=proof.independentResult||{},recurrence=proof.recurrenceCheck||{};
    const tp=finiteTime(prod.verifiedAt),tn=finiteTime(next.verifiedAt),
      to=finiteTime(outcome.verifiedAt),tr=finiteTime(recurrence.verifiedAt);
    const chronology=tp!==null&&tn!==null&&to!==null&&tr!==null&&
      tp>=seen&&tn>tp&&to>=tn&&tr>=to+3600000&&tr<=now+300000;
    const receipts=[prod.providerReceiptId,next.runId,outcome.providerReceiptId,recurrence.sourceId];
    const distinctReceipts=receipts.every(nonEmpty)&&new Set(receipts).size===4;
    const checks={
      CAUSE_DOCUMENTED:nonEmpty(row.root_cause),
      FIX_DOCUMENTED:nonEmpty(row.proven_fix),
      PREVENTION_DOCUMENTED:nonEmpty(row.prevention_rule),
      REGRESSION_REFERENCE:nonEmpty(row.regression_ref)&&proof.regressionPassed===true,
      PRODUCTION_PROVIDER_READBACK:nonEmpty(prod.commitSha)&&/^[0-9a-f]{40}$/.test(prod.commitSha)&&nonEmpty(prod.providerReceiptId)&&tp!==null,
      NEXT_NATURAL_AGENT_RUN:nonEmpty(next.runId)&&next.canonicalOwnerVerified===true&&tn!==null,
      INDEPENDENT_RESULT_READBACK:nonEmpty(outcome.source)&&nonEmpty(outcome.providerReceiptId)&&outcome.verified===true&&to!==null,
      LATER_RECURRENCE_CHECK:recurrence.passed===true&&nonEmpty(recurrence.sourceId)&&chronology&&distinctReceipts&&
        ['VALIDATED','PROVEN','PREFERRED'].includes(row.maturity)&&Number.isSafeInteger(row.occurrence_count)&&row.occurrence_count>0&&
        row.last_seen_at===recurrence.lastIncidentAt
    };
    const missing=required.filter(key=>!checks[key]);
    cases.push({
      fingerprint:row.fingerprint.slice(0,150),
      latestIncidentAt:row.last_seen_at,maturity:String(row.maturity||'UNKNOWN').slice(0,30),
      occurrences:Number.isSafeInteger(row.occurrence_count)?row.occurrence_count:null,
      missing,recordedProofCandidate:missing.length===0,
      state:missing.length?'EVIDENCE_DUE':'STORED_PROOF_REQUIRES_INDEPENDENT_EXTERNAL_CROSSCHECK',
      independentOutcomeProven:false,repairClosed:false
    });
  }
  return {
    contract:'POWERHOUSE_ONE_BRAIN_RECOVERY_CLOSURE_AUDIT_V1',
    status:cases.length?'RECOVERY_PROOF_PENDING':'NO_RECENT_REGISTER_ROWS_NOT_GREEN',
    reason:cases.length?'INDEPENDENT_PROVIDER_CROSSCHECK_AND_NEXT_RUN_REQUIRED':'NO_INCIDENT_SNAPSHOT',
    sourceReadbackVerified:true,independentlyVerified:false,
    rowsInspected:cases.length,recordedProofCandidates:cases.filter(r=>r.recordedProofCandidate).length,
    evidenceDebt:cases.filter(r=>r.missing.length).length,
    cases:cases.slice(0,12),required
  };
}
