// ONE BRAIN read-only failure pattern quality audit. Existing registry remains authoritative.
// This is not a repair executor, independent provider verifier or maturity setter.
const meaningful = value => typeof value === 'string' && value.trim().length > 0 &&
  !/^(unknown|pending|none|none yet|n\/a|not proven|unverified|open_rca|tbd)$/i.test(value.trim());
const when = s => typeof s === 'string' && Number.isFinite(Date.parse(s)) ? Date.parse(s) : null;
const fail = reason => ({status:'SOURCE_COVERAGE_UNVERIFIED',reason,global_green:false,authority:'public.brain_failure_registry'});

export function auditFailureBacklog({rows,expectedTotal,readbackComplete=false,observedAt=new Date().toISOString(),maxRows=10000}={}) {
  if (!Array.isArray(rows) || !Number.isSafeInteger(expectedTotal) || expectedTotal < 0 || expectedTotal > maxRows ||
      rows.length !== expectedTotal || readbackComplete !== true || when(observedAt) === null)
    return fail('NO_EXACT_SOURCE_COUNT_OR_READBACK');
  const known = new Set();
  const ordered = [];
  const totals = {all:0,observed:0,missing_cause:0,missing_prevention:0,missing_regression:0,
    incomplete_patterns:0,high_recurrence_incomplete:0,oldest_open_at:null};
  for (const row of rows) {
    if (!row || typeof row.fingerprint !== 'string' || !row.fingerprint.trim() || row.fingerprint.length > 500 ||
        known.has(row.fingerprint) || typeof row.maturity !== 'string' || !Number.isSafeInteger(Number(row.occurrence_count)) ||
        Number(row.occurrence_count) < 0 || when(row.last_seen_at) === null)
      return fail('INVALID_OR_DUPLICATED_REGISTRY_ROW');
    known.add(row.fingerprint);
    totals.all++;
    if (row.maturity !== 'OBSERVED') continue;
    totals.observed++;
    const missing = [!meaningful(row.root_cause),!meaningful(row.prevention_rule),!meaningful(row.regression_ref)];
    if (missing[0]) totals.missing_cause++;
    if (missing[1]) totals.missing_prevention++;
    if (missing[2]) totals.missing_regression++;
    if (!missing.some(Boolean)) continue;
    totals.incomplete_patterns++;
    const ageHours = Math.max(0,(Date.parse(observedAt)-Date.parse(row.last_seen_at))/3600000);
    const repeated = Number(row.occurrence_count) >= 3;
    if (repeated) totals.high_recurrence_incomplete++;
    if (!totals.oldest_open_at || Date.parse(row.last_seen_at)<Date.parse(totals.oldest_open_at))
      totals.oldest_open_at=row.last_seen_at;
    const missingKeys = ['root_cause','prevention_rule','regression_ref'].filter((_,i)=>missing[i]);
    ordered.push({fingerprint:row.fingerprint,missing:missingKeys,
      classification:ageHours <= 72 && repeated ? 'RECURRENT_SOURCE_OWNER_RECOVERY_DUE' : 'SOURCE_EVIDENCE_TRIAGE_DUE',
      owner:'ORIGINAL_FINGERPRINT_OWNER',occurrences:Number(row.occurrence_count),last_seen_at:row.last_seen_at,
      action:'ORIGINAL_OWNER_SOURCE_RCA_REGRESSION_PROVIDER_READBACK',
      // A reference in a field never proves the test passed or the provider recovered.
      production_verified:false});
  }
  ordered.sort((a,b)=>{
    const aRecent=Date.parse(observedAt)-Date.parse(a.last_seen_at)<=72*3600000;
    const bRecent=Date.parse(observedAt)-Date.parse(b.last_seen_at)<=72*3600000;
    return Number(bRecent)-Number(aRecent) || b.occurrences-a.occurrences || a.fingerprint.localeCompare(b.fingerprint);
  });
  return {status:ordered.length?'RECOVERY_TRIAGE_DUE':'NO_DOCUMENTATION_GAPS_IN_OBSERVED_PATTERNS',
    global_green:false,authority:'public.brain_failure_registry',readback_at:observedAt,
    totals,obligations:ordered};
}
