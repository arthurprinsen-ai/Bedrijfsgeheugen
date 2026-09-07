function matchesExact(path, values = []) {
  return values.includes(path);
}

function matchesPrefix(path, values = []) {
  return values.some(prefix => path.startsWith(prefix));
}

export function classifyWebsiteReleaseRisk({ changedPaths = [], policy = {} } = {}) {
  const paths = [...new Set((changedPaths || []).filter(Boolean))];
  const menuExact = policy.menuExactPaths || [];
  const menuPrefixes = policy.menuPrefixes || [];
  const fullExact = policy.fullSurfaceExactPaths || [];
  const fullPrefixes = policy.fullSurfacePrefixes || [];

  const fullPaths = [];
  const menuPaths = [];

  for (const path of paths) {
    const isMenu = matchesExact(path, menuExact) || matchesPrefix(path, menuPrefixes);
    if (isMenu) {
      menuPaths.push(path);
      continue;
    }
    if (matchesExact(path, fullExact) || matchesPrefix(path, fullPrefixes)) {
      fullPaths.push(path);
    }
  }

  if (fullPaths.length > 0) {
    return {
      profile: 'full',
      requiresBrowser: true,
      requiresMenuBrowser: true,
      requiresFullBrowser: true,
      matchedPaths: fullPaths,
      reason: 'public-surface-change'
    };
  }

  if (menuPaths.length > 0) {
    return {
      profile: 'menu',
      requiresBrowser: true,
      requiresMenuBrowser: true,
      requiresFullBrowser: false,
      matchedPaths: menuPaths,
      reason: 'megamenu-surface-change'
    };
  }

  return {
    profile: 'none',
    requiresBrowser: false,
    requiresMenuBrowser: false,
    requiresFullBrowser: false,
    matchedPaths: [],
    reason: 'no-public-surface-change'
  };
}
