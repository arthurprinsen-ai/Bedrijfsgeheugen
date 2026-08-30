const SHA40 = /^[a-f0-9]{40}$/i;

function uniqueStrings(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

export function certifyMainProtection(input = {}) {
  const branch = String(input.branch || '').trim();
  if (branch !== 'main') throw new Error('INVALID_BRANCH');

  const observedSha = String(input.observedSha || '').trim().toLowerCase();
  if (!SHA40.test(observedSha)) throw new Error('INVALID_OBSERVED_SHA');

  const evidenceRef = String(input.evidenceRef || '').trim();
  if (!evidenceRef) throw new Error('MISSING_EVIDENCE_REF');

  const expectedChecks = uniqueStrings(input.expectedChecks);
  if (expectedChecks.length === 0) throw new Error('MISSING_EXPECTED_CHECKS');

  const requiredChecks = uniqueStrings(input.requiredChecks);
  const requiredSet = new Set(requiredChecks);
  const missingChecks = expectedChecks.filter(check => !requiredSet.has(check));
  const rulesets = Array.isArray(input.rulesets) ? input.rulesets : [];
  const activeBranchRuleset = rulesets.some(rule =>
    String(rule?.enforcement || '').toLowerCase() === 'active' &&
    String(rule?.target || '').toLowerCase() === 'branch'
  );

  const blockers = [];
  if (input.protected !== true || input.protectionEnabled !== true) blockers.push('BRANCH_NOT_PROTECTED');
  if (String(input.enforcementLevel || '').toLowerCase() === 'off' || requiredChecks.length === 0) {
    blockers.push('REQUIRED_CHECKS_DISABLED');
  }
  if (missingChecks.length > 0) blockers.push('REQUIRED_CHECKS_MISSING');
  if (!activeBranchRuleset && input.protected !== true) blockers.push('NO_ACTIVE_BRANCH_RULESET');

  const mainProtectionReady = blockers.length === 0;
  return Object.freeze({
    contract: 'BRAIN-DELIVERY-v2',
    proof: 'github-main-protection',
    branch,
    observedSha,
    evidenceRef,
    protected: input.protected === true,
    protectionEnabled: input.protectionEnabled === true,
    enforcementLevel: String(input.enforcementLevel || 'unknown'),
    requiredChecks: Object.freeze(requiredChecks),
    expectedChecks: Object.freeze(expectedChecks),
    missingChecks: Object.freeze(missingChecks),
    activeBranchRuleset,
    blockers: Object.freeze(blockers),
    mainProtectionReady,
    truth_status: mainProtectionReady ? 'VERIFIED' : 'BLOCKED',
  });
}
