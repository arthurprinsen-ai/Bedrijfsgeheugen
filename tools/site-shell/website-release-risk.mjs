function uniqueSorted(values = []) {
  return [...new Set(values.map(value => String(value).trim()).filter(Boolean))].sort();
}

function matchesRule(path, rule) {
  const normalized = String(rule || '').trim();
  if (!normalized) return false;
  return normalized.endsWith('/') ? path.startsWith(normalized) : path === normalized || path.startsWith(normalized);
}

function routeFromRootHtml(path) {
  if (!/^[^/]+\.html$/i.test(path)) return null;
  if (path === 'index.html') return '/';
  return `/${path.replace(/\.html$/i, '')}`;
}

function acceptedRoutes(acceptedBaseline = {}) {
  return new Set((acceptedBaseline.routes || []).map(item => item?.route).filter(Boolean));
}

export function classifyWebsiteRelease({ changedPaths = [], riskConfig = {}, acceptedBaseline = {} } = {}) {
  const paths = uniqueSorted(changedPaths);
  if (!paths.length) throw new TypeError('changedPaths must contain at least one path');
  if (riskConfig.version !== 'WEBSITE-RELEASE-RISK-v1') throw new TypeError('WEBSITE-RELEASE-RISK-v1 config is required');

  const routeSet = acceptedRoutes(acceptedBaseline);
  const reasons = [];
  const routes = new Set();
  let lane = 'fast-fix';
  let escalated = false;

  for (const path of paths) {
    if ((riskConfig.highRiskPaths || []).some(rule => matchesRule(path, rule))) {
      lane = 'high-risk';
      escalated = true;
      reasons.push(`high-risk:${path}`);
      continue;
    }

    let owned = false;
    for (const [prefix, ownedRoutes] of Object.entries(riskConfig.pageLocalAssets || {})) {
      if (!path.startsWith(prefix)) continue;
      owned = true;
      for (const route of ownedRoutes || []) routes.add(route);
      reasons.push(`page-local:${path}`);
      break;
    }
    if (owned) continue;

    const rootRoute = routeFromRootHtml(path);
    if (rootRoute) {
      routes.add(rootRoute);
      if (lane !== 'high-risk') lane = 'normal';
      if (!routeSet.has(rootRoute)) {
        escalated = true;
        reasons.push(`unknown-root-route:${rootRoute}`);
      } else {
        reasons.push(`root-html:${path}`);
      }
      continue;
    }

    if (lane !== 'high-risk') lane = 'normal';
    escalated = true;
    reasons.push(`unowned-or-unknown:${path}`);
  }

  const required = lane === 'fast-fix'
    ? riskConfig.fastFixRequiredTestSets
    : lane === 'normal'
      ? riskConfig.normalRequiredTestSets
      : riskConfig.highRiskRequiredTestSets;

  return Object.freeze({
    lane,
    changed_files: Object.freeze(paths),
    affected_routes: Object.freeze(uniqueSorted([...routes])),
    risk_reasons: Object.freeze(uniqueSorted(reasons)),
    required_test_sets: Object.freeze([...(required || [])]),
    escalated,
  });
}
