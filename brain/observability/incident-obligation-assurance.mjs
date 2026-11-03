// ONE BRAIN incident-obligation audit: pure reconciliation, NEVER a second writer.
// Compare independently observed provider failures to canonical occurrence readbacks.
// Never equate "nothing reported" with "nothing failed".
const ID = /^[a-z0-9_.:/|+-]{3,220}$/i;
const SHA = /^[a-f0-9]{64}$/i;
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const safe = value => typeof value === 'string' && ID.test(value) ? value : null;

export const INCIDENT_AUDIT_FINGERPRINT = 'powerhouse|agent-incident|silent-failure-and-unverified-recovery|20261103-v1';

export function reconcileIncidentObligations({
  observations,
  receipts,
  recoveries,
  sourceReadbackComplete = false,
  registryReadbackComplete = false
} = {}) {
  const result = {
    schema: 'powerhouse-incident-obligation-audit-v1',
    fingerprint: INCIDENT_AUDIT_FINGERPRINT,
    status: 'SOURCE_COVERAGE_UNVERIFIED',
    global_green: false,
    audited_events: 0,
    registered: 0,
    proven_recovered: 0,
    missing_reports: 0,
    recovery_required: 0,
    proof_required: 0,
    invalid_events: 0,
    recurring_failures: 0,
    provider_conflicts: 0,
    obligations: [],
    authority: 'EXISTING_ONE_BRAIN_HEARTBEAT_EXCLUSIVE_WRITER'
  };
  if (!Array.isArray(observations) || !Array.isArray(receipts) || !Array.isArray(recoveries)) return result;
  result.audited_events = observations.length;
  const byKey = new Map();
  const byProviderId = new Map(); // A single native source event cannot have competing incident identities.
  const receiptsById = new Map();
  const repairsById = new Map();
  for (const entry of receipts) {
    const id = safe(entry?.provider_event_id);
    if (id) {
      if (!receiptsById.has(id)) receiptsById.set(id, []);
      receiptsById.get(id).push(entry);
    }
  }
  for (const entry of recoveries) {
    const id = safe(entry?.provider_event_id);
    if (id) {
      if (!repairsById.has(id)) repairsById.set(id, []);
      repairsById.get(id).push(entry);
    }
  }
  for (const event of observations) {
    const id = safe(event?.provider_event_id);
    const fingerprint = safe(event?.fingerprint);
    const at = date(event?.observed_at);
    const payload = event?.payload_sha256;
    const valid = Boolean(id && fingerprint && at !== null && (payload == null || SHA.test(payload)));
    if (!valid) {
      result.invalid_events++;
      result.obligations.push({status:'PROVIDER_EVENT_IDENTITY_INVALID', next_action:'EXISTING_OWNER_REOBSERVE_AND_REGISTER', provider_event_id:id});
      continue;
    }
    const priorFingerprint = byProviderId.get(id);
    if (priorFingerprint && priorFingerprint !== fingerprint) {
      result.provider_conflicts++;
      result.obligations.push({
        status:'PROVIDER_EVENT_FINGERPRINT_CONFLICT', provider_event_id:id, fingerprint,
        next_action:'EXISTING_OWNER_RECONCILE_ORIGINAL_EVENT_ID'
      });
      continue; // Never acknowledge both competing identities as separately repaired.
    }
    byProviderId.set(id,fingerprint);
    const identity = id + '|' + fingerprint;
    if (byKey.has(identity)) {
      const previous = byKey.get(identity);
      if (previous.payload_sha256 && payload && previous.payload_sha256 !== payload) {
        result.provider_conflicts++;
        result.obligations.push({status:'PROVIDER_EVENT_EVIDENCE_CONFLICT', provider_event_id:id, fingerprint, next_action:'EXISTING_OWNER_INCIDENT_CONFLICT_REVIEW'});
      }
      continue; // identical provider event is one occurrence, never two incidents.
    }
    byKey.set(identity, event);
    const matches = (receiptsById.get(id) || []).filter(r => r.fingerprint === fingerprint && r.readback_confirmed === true && (!payload || r.payload_sha256 === payload));
    if (matches.length !== 1) {
      if (matches.length > 1) result.provider_conflicts++;
      else result.missing_reports++;
      result.obligations.push({
        provider_event_id:id, fingerprint,
        status:matches.length ? 'REGISTRY_RECEIPT_CONFLICT' : 'UNREPORTED_PROVIDER_FAILURE',
        next_action:'EXISTING_ONE_BRAIN_OWNER_ATOMIC_OBSERVE_AND_READBACK'
      });
      continue;
    }
    result.registered++;
    const receipt = matches[0];
    const matchingRecoveries = (repairsById.get(id) || []).filter(x => x.fingerprint === fingerprint);
    if (matchingRecoveries.length > 1) {
      result.provider_conflicts++;
      result.obligations.push({
        status:'RECOVERY_RECEIPT_CONFLICT', provider_event_id:id, fingerprint,
        next_action:'EXISTING_OWNER_VERIFY_SINGLE_CANONICAL_RECOVERY'
      });
      continue; // Avoid .find() silently selecting a favorable conflicting recovery.
    }
    const recovery = matchingRecoveries[0];
    if (!recovery || !safe(recovery.owner) || !safe(recovery.obligation_id) || recovery.fix_attempted !== true) {
      result.recovery_required++;
      result.obligations.push({provider_event_id:id,fingerprint,status:'RECOVERY_NOT_ATTEMPTED',
        next_action:recovery?.authorization_required === true ? 'EXISTING_OWNER_ESCALATE_PERMISSION_BOUNDARY' : 'EXISTING_OWNER_SAFE_RECOVERY'});
      continue;
    }
    const verifiedAt = date(recovery.verified_at);
    const detectedAt = date(receipt.registered_at);
    const fullyVerified = recovery.status === 'VERIFIED'
      && recovery.regression_passed === true
      && recovery.independent_provider_readback === true
      && recovery.prevention_applied === true
      && safe(recovery.skill_version)
      && safe(recovery.release_sha)
      && /^[a-f0-9]{40}$/i.test(recovery.release_sha)
      && verifiedAt !== null && detectedAt !== null && verifiedAt >= detectedAt && detectedAt >= at;
    if (!fullyVerified) {
      result.proof_required++;
      result.obligations.push({provider_event_id:id,fingerprint,status:'RECOVERY_PROOF_MISSING',
        next_action:'EXISTING_OWNER_REGRESSION_PROVIDER_READBACK_AND_LEARNING'});
      continue;
    }
    const recurrence = observations.some(other =>
      other !== event && other?.fingerprint === fingerprint && other?.provider_event_id !== id && date(other?.observed_at) > verifiedAt);
    if (recurrence) {
      result.recurring_failures++;
      result.obligations.push({provider_event_id:id,fingerprint,status:'REGRESSION_RECURRED_AFTER_VERIFICATION',
        next_action:'EXISTING_OWNER_REOPEN_FINGERPRINT_AND_PREVENTION'});
      continue;
    }
    result.proven_recovered++;
  }
  if (result.invalid_events || result.provider_conflicts) result.status = 'INCIDENT_IDENTITY_CONFLICT';
  else if (result.missing_reports) result.status = 'UNREPORTED_FAILURE_DETECTED';
  else if (result.recovery_required) result.status = 'SAFE_RECOVERY_REQUIRED';
  else if (result.proof_required || result.recurring_failures) result.status = 'RECOVERY_NOT_PROVEN';
  else if (!sourceReadbackComplete || !registryReadbackComplete) result.status = 'SOURCE_COVERAGE_UNVERIFIED';
  else result.status = observations.length ? 'OBSERVED_INCIDENTS_INDEPENDENTLY_PROVEN' : 'NO_OBSERVED_FAILURES_IN_SCANNED_SCOPE';
  return result;
}
