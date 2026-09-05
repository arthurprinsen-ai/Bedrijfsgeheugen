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
