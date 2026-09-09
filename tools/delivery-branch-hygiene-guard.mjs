function normalizePath(value) {
  return String(value || '').trim().replace(/^\.\//, '');
}

function globMatches(path, pattern) {
  const cleanPath = normalizePath(path);
  const cleanPattern = normalizePath(pattern);
  if (!cleanPattern) return false;
  if (cleanPattern.endsWith('/**')) return cleanPath.startsWith(cleanPattern.slice(0, -3));
  if (cleanPattern.endsWith('/')) return cleanPath.startsWith(cleanPattern);
  return cleanPath === cleanPattern;
}

// Verificatie-artefacten bestaan alleen om een wijziging te bewijzen: tests en
// productie-readbacks. Ze horen bij de wijziging zelf, dus ze vervuilen de scope
// niet en tellen niet mee in het Scope-Budget. Zonder deze uitzondering blokkeert
// de poort precies het borgen dat we bij elke wijziging willen.
const VERIFICATION_PATTERNS = [
  /^tests\//,
  /\.test\.(mjs|js|cjs)$/,
  /^\.github\/workflows\/[^/]*readback[^/]*\.ya?ml$/,
];

export function isVerificationArtifact(path) {
  const cleanPath = normalizePath(path);
  return VERIFICATION_PATTERNS.some(pattern => pattern.test(cleanPath));
}

export function parseScopeMetadata(body = '') {
  const result = {};
  for (const rawLine of String(body).split(/\r?\n/)) {
    const line = rawLine.trim();
    const scope = line.match(/^Change-Scope:\s*(.+)$/i);
    if (scope) result.expectedPaths = scope[1].split(',').map(normalizePath).filter(Boolean);
    const budget = line.match(/^Scope-Budget:\s*(\d+)$/i);
    if (budget) result.maxFiles = Number(budget[1]);
  }
  return result;
}

export function evaluateBranchHygiene({ changedPaths = [], metadata = {}, labels = [], hardMaxFiles = 40 } = {}) {
  const paths = [...new Set(changedPaths.map(normalizePath).filter(Boolean))].sort();
  const labelSet = new Set(labels.map(value => String(value).trim()).filter(Boolean));
  const broadApproved = labelSet.has('scope-broad-approved');
  const expectedPaths = Array.isArray(metadata.expectedPaths) ? metadata.expectedPaths.map(normalizePath).filter(Boolean) : [];
  const maxFiles = Number.isInteger(metadata.maxFiles) && metadata.maxFiles > 0 ? metadata.maxFiles : null;

  const verificationPaths = paths.filter(isVerificationArtifact);
  const deliveryPaths = paths.filter(path => !isVerificationArtifact(path));

  const unexpectedPaths = expectedPaths.length
    ? deliveryPaths.filter(path => !expectedPaths.some(pattern => globMatches(path, pattern)))
    : [];

  if (unexpectedPaths.length) {
    return Object.freeze({
      ok: false,
      state: 'SCOPE_CONTAMINATED',
      changedFileCount: deliveryPaths.length,
      unexpectedPaths,
      verificationPaths,
    });
  }

  if (maxFiles && deliveryPaths.length > maxFiles) {
    return Object.freeze({
      ok: false,
      state: 'SCOPE_BUDGET_EXCEEDED',
      changedFileCount: deliveryPaths.length,
      unexpectedPaths: [],
      verificationPaths,
      maxFiles,
    });
  }

  if (!broadApproved && paths.length > hardMaxFiles) {
    return Object.freeze({
      ok: false,
      state: 'HARD_SCOPE_LIMIT_EXCEEDED',
      changedFileCount: paths.length,
      unexpectedPaths: [],
      verificationPaths,
      hardMaxFiles,
    });
  }

  return Object.freeze({
    ok: true,
    state: 'SCOPE_CLEAN',
    changedFileCount: deliveryPaths.length,
    unexpectedPaths: [],
    verificationPaths,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const changedPaths = JSON.parse(process.env.CHANGED_PATHS_JSON || '[]');
  const labels = JSON.parse(process.env.PR_LABELS_JSON || '[]');
  const metadata = parseScopeMetadata(process.env.PR_BODY || '');
  const result = evaluateBranchHygiene({ changedPaths, metadata, labels });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
