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

/**
 * Bounded provider-only readback; commit subject supplies an untrusted lookup
 * hint, NEVER a proof. A merged PR is trusted only after GitHub itself
 * confirms the exact merge commit SHA and main base branch.
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
  let lastAssociation;
  const associatedPath = `repos/${repository}/commits/${headSha}/pulls`;
  for (let i = 0; i < MAIN_WRITE_PROOF_ATTEMPTS; i++) {
    attempts++;
    try {
      const provider = await githubRead(associatedPath);
      if (!Array.isArray(provider)) throw new Error('association_response_not_array');
      lastAssociation = provider.map(normalizedProviderPr);
      if (lastAssociation.some(pr =>
        pr.merged === true && pr.baseRef === 'main' &&
        pr.mergeCommitSha === headSha && Number.isInteger(pr.number) && pr.number > 0
      )) return { associatedPullRequests: lastAssociation, source: 'GITHUB_COMMIT_ASSOCIATION', attempts };
    } catch {
      // Transient invalid JSON, empty provider response or GitHub API outage:
      // do not promote absent data to an unauthorized-main conclusion.
    }
    if (i < MAIN_WRITE_PROOF_ATTEMPTS - 1) await sleep(150 * (i + 1));
  }

  // GitHub squash commit suffix is ONLY a candidate ID. Verify via the PR
  // provider record itself; forged commit text or unrelated PRs cannot pass.
  const id = typeof commitSubject === 'string' ? /\(#([1-9][0-9]{0,8})\)\s*$/.exec(commitSubject)?.[1] : null;
  if (id) {
    for (let i = 0; i < 2; i++) {
      attempts++;
      try {
        const record = await githubRead(`repos/${repository}/pulls/${id}`);
        const pr = normalizedProviderPr(record);
        if (pr.number === Number(id) && pr.merged && pr.baseRef === 'main' &&
            pr.mergeCommitSha === headSha) {
          return { associatedPullRequests: [pr], source: 'GITHUB_VERIFIED_PR_FALLBACK', attempts };
        }
        break;
      } catch {
        if (i === 0) await sleep(200);
      }
    }
  }
  return { associatedPullRequests: lastAssociation, source: 'PROVIDER_PR_PROOF_UNVERIFIED', attempts };
}
