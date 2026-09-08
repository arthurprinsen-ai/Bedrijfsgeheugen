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

  const unexpectedPaths = expectedPaths.length
    ? paths.filter(path => !expectedPaths.some(pattern => globMatches(path, pattern)))
    : [];

  if (unexpectedPaths.length) {
    return Object.freeze({
      ok: false,
      state: 'SCOPE_CONTAMINATED',
      changedFileCount: paths.length,
      unexpectedPaths,
    });
  }

  if (maxFiles && paths.length > maxFiles) {
    return Object.freeze({
      ok: false,
      state: 'SCOPE_BUDGET_EXCEEDED',
      changedFileCount: paths.length,
      unexpectedPaths: [],
      maxFiles,
    });
  }

  if (!broadApproved && paths.length > hardMaxFiles) {
    return Object.freeze({
      ok: false,
      state: 'HARD_SCOPE_LIMIT_EXCEEDED',
      changedFileCount: paths.length,
      unexpectedPaths: [],
      hardMaxFiles,
    });
  }

  return Object.freeze({
    ok: true,
    state: 'SCOPE_CLEAN',
    changedFileCount: paths.length,
    unexpectedPaths: [],
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
