// Pure release gate: called before constructing or submitting GitHub rulesets.
export function determineMergeCapability(repo = {}) {
  const type = repo?.owner?.type;
  if (type === 'User') return Object.freeze({ mode: 'protected_pr', mergeQueueSupported: false, reason: 'PERSONAL_REPOSITORY' });
  if (type === 'Organization') return Object.freeze({ mode: 'protected_pr', mergeQueueSupported: null, reason: 'ELIGIBILITY_NOT_PROVEN' });
  return Object.freeze({ mode: 'blocked', mergeQueueSupported: null, reason: 'OWNER_TYPE_UNKNOWN' });
}
export function filterUnsupportedMergeQueueRules(repo, rules) {
  if (!Array.isArray(rules)) throw new TypeError('rules must be an array');
  const capability = determineMergeCapability(repo);
  if (capability.mode === 'blocked') throw new Error('REPOSITORY_OWNER_UNVERIFIED');
  if (capability.mergeQueueSupported !== true && rules.some(rule => rule?.type === 'merge_queue')) {
    throw new Error('MERGE_QUEUE_UNSUPPORTED_OR_UNVERIFIED: use protected PR rules');
  }
  return rules;
}
export function classifyRulesetApiError(status, message = '') {
  if (Number(status) === 422 && /invalid rule ['"]?merge_queue/i.test(String(message))) {
    return Object.freeze({ category: 'UNSUPPORTED_MERGE_QUEUE', retryIdenticalPayload: false, fallback: 'protected_pr' });
  }
  return Object.freeze({ category: 'UNKNOWN_PROVIDER_FAILURE', retryIdenticalPayload: false, fallback: 'diagnose' });
}
export function releaseEvidenceStatus({ headSha, baseSha, verifiedBaseSha, requiredChecks = {}, mergedSha, deployedSha, productionReadback } = {}) {
  const mandatory = ['Required', 'BRAIN', 'CodeQL'];
  const checksValid = Boolean(headSha) && mandatory.every(name => {
    const proof = requiredChecks[name];
    return proof?.headSha === headSha && proof?.conclusion === 'success';
  });
  const mergeValid = Boolean(mergedSha) && mergedSha === deployedSha;
  const ready = checksValid && Boolean(baseSha) && baseSha === verifiedBaseSha && mergeValid && productionReadback?.ok === true && productionReadback?.sha === mergedSha;
  return Object.freeze({ ready, status: ready ? 'VERIFIED_PRODUCTION' : 'NOT_VERIFIED', checksValid, mergeValid });
}
