const MATERIAL_PREFIXES = Object.freeze([
  '.github/',
  'brain/',
  'config/',
  'scripts/',
  'supabase/',
  'tests/',
  'tools/',
]);

function normalizedPaths(changedPaths) {
  if (!Array.isArray(changedPaths)) return null;
  return changedPaths
    .filter(path => typeof path === 'string')
    .map(path => path.trim())
    .filter(Boolean);
}

function governedPullRequestForHead(associatedPullRequests, headSha) {
  if (!Array.isArray(associatedPullRequests)) return null;
  return associatedPullRequests.find(pr =>
    pr &&
    pr.merged === true &&
    pr.baseRef === 'main' &&
    pr.mergeCommitSha === headSha &&
    Number.isInteger(pr.number) && pr.number > 0
  ) || null;
}

export function classifyMainWrite({ branch, parentCount, changedPaths, headSha, associatedPullRequests } = {}) {
  if (branch !== 'main') return { status: 'NOT_MAIN', productionGreenAllowed: true, recoveryRequired: false, fingerprint: null, headSha: typeof headSha === 'string' ? headSha : null, materialPaths: [] };
  const paths = normalizedPaths(changedPaths);
  if (!Number.isInteger(parentCount) || parentCount < 0 || paths === null || typeof headSha !== 'string' || !headSha.trim()) return { status: 'UNKNOWN_MAIN_WRITE', productionGreenAllowed: false, recoveryRequired: true, fingerprint: 'delivery|main-write|unverifiable-provenance-v1', headSha: typeof headSha === 'string' ? headSha : null, materialPaths: [] };
  if (parentCount >= 2) return { status: 'GOVERNED_MERGE', productionGreenAllowed: true, recoveryRequired: false, fingerprint: null, headSha, materialPaths: [] };
  const materialPaths = paths.filter(path => MATERIAL_PREFIXES.some(prefix => path.startsWith(prefix)));
  if (parentCount === 1 && materialPaths.length > 0) {
    if (!Array.isArray(associatedPullRequests)) return { status: 'UNKNOWN_MAIN_WRITE', productionGreenAllowed: false, recoveryRequired: true, fingerprint: 'delivery|main-write|unverifiable-pr-association-v1', headSha, materialPaths };
    const governedPullRequest = governedPullRequestForHead(associatedPullRequests, headSha);
    if (governedPullRequest) return { status: 'GOVERNED_SQUASH_MERGE', productionGreenAllowed: true, recoveryRequired: false, fingerprint: null, headSha, materialPaths: [], pullRequestNumber: governedPullRequest.number };
    return { status: 'DIRECT_MAIN_WRITE_INCIDENT', productionGreenAllowed: false, recoveryRequired: true, fingerprint: 'delivery|main-write|material-single-parent-bypass-v1', headSha, materialPaths };
  }
  return { status: 'NON_MATERIAL_MAIN_WRITE', productionGreenAllowed: true, recoveryRequired: false, fingerprint: null, headSha, materialPaths: [] };
}

export { MATERIAL_PREFIXES };

const MAIN_WRITE_PROOF_ATTEMPTS = 3;
const normalizedProviderPr = pr => ({
  number: pr?.number,
  merged: Boolean(pr?.merged_at),
  baseRef: pr?.base?.ref ?? null,
  mergeCommitSha: pr?.merge_commit_sha ?? null,
});

const isVerifiedProviderPr = (pr, headSha, id = null) =>
  pr.merged === true && pr.baseRef === 'main' &&
  pr.mergeCommitSha === headSha && Number.isInteger(pr.number) && pr.number > 0 &&
  (id === null || pr.number === id);

function isProviderRateLimited(error) {
  const message = String(error?.message ?? error ?? '');
  // Do not blindly retry an installation's exhausted primary/secondary API
  // allowance: GitHub explicitly warns that continued requests can block the app.
  return /API rate limit exceeded|secondary rate limit|rate.limit.*exceeded|HTTP 429/i.test(message);
}

/**
 * GitHub's squash suffix is an untrusted lookup HINT only, never an authority.
 * Prefer one exact PR read to multiple commit-association reads, but accept
 * only GitHub's own exact main merge SHA + merged_at proof. All API errors,
 * particularly rate limits, are FAIL CLOSED; never synthesize a direct-write
 * incident from missing provider evidence.
 */
export async function resolveMainWriteAssociatedPullRequests({
  repository, headSha, commitSubject, githubRead, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') ||
      !/^[0-9a-f]{40}$/.test(headSha ?? '') ||
      typeof githubRead !== 'function') {
    return { associatedPullRequests: undefined, source: 'INVALID_PROVENANCE_INPUT', attempts: 0 };
  }
  let attempts = 0;
  const idText = typeof commitSubject === 'string'
    ? /\(#([1-9][0-9]{0,8})\)\s*$/.exec(commitSubject)?.[1] : null;
  const id = idText ? Number(idText) : null;
  if (id !== null) {
    attempts++;
    try {
      const record = await githubRead(`repos/${repository}/pulls/${id}`);
      const candidate = normalizedProviderPr(record);
      if (isVerifiedProviderPr(candidate, headSha, id))
        return { associatedPullRequests: [candidate], source: 'GITHUB_VERIFIED_PR_FAST_PATH', attempts };
    } catch (error) {
      if (isProviderRateLimited(error))
        return { associatedPullRequests: undefined, source: 'PROVIDER_RATE_LIMITED', attempts };
      // A candidate could have been removed or transiently unavailable:
      // continue to the independent exact-commit association read.
    }
  }

  let lastAssociation;
  const path = `repos/${repository}/commits/${headSha}/pulls`;
  for (let i = 0; i < MAIN_WRITE_PROOF_ATTEMPTS; i++) {
    attempts++;
    try {
      const provider = await githubRead(path);
      if (!Array.isArray(provider)) throw new Error('association_response_not_array');
      lastAssociation = provider.map(normalizedProviderPr);
      if (lastAssociation.some(pr => isVerifiedProviderPr(pr, headSha)))
        return { associatedPullRequests: lastAssociation, source: 'GITHUB_COMMIT_ASSOCIATION', attempts };
    } catch (error) {
      if (isProviderRateLimited(error))
        return { associatedPullRequests: undefined, source: 'PROVIDER_RATE_LIMITED', attempts };
      // For transient malformed/incomplete reads retain a bounded retry,
      // never treating an absent response as proof of unauthorized main write.
    }
    if (i < MAIN_WRITE_PROOF_ATTEMPTS - 1) await sleep(150 * (i + 1));
  }
  return { associatedPullRequests: lastAssociation, source: 'PROVIDER_PR_PROOF_UNVERIFIED', attempts };
}
