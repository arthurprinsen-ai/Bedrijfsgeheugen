function matchesExact(path, values = []) {
  return values.includes(path);
}

function matchesPrefix(path, values = []) {
  return values.some(prefix => path.startsWith(prefix));
}

function routeForPath(path) {
  if (path === 'index.html') return '/';
  if (path.startsWith('blog/') && path.endsWith('.html')) return `/${path.replace(/\.html$/, '')}`;
  if (path.endsWith('.html')) return `/${path.replace(/^pages\//, '').replace(/\.html$/, '')}`;
  return null;
}

export function classifyWebsiteReleaseRisk({ changedPaths = [], policy = {} } = {}) {
  const paths = [...new Set((changedPaths || []).filter(Boolean))];
  const menuExact = policy.menuExactPaths || [];
  const menuPrefixes = policy.menuPrefixes || [];
  const targetedExact = policy.targetedSurfaceExactPaths || [];
  const targetedPrefixes = policy.targetedSurfacePrefixes || [];
  const fullExact = policy.fullSurfaceExactPaths || [];
  const fullPrefixes = policy.fullSurfacePrefixes || [];

  const fullPaths = [];
  const menuPaths = [];
  const targetedPaths = [];

  for (const path of paths) {
    if (matchesExact(path, menuExact) || matchesPrefix(path, menuPrefixes)) {
      menuPaths.push(path);
      continue;
    }
    if (matchesExact(path, fullExact) || matchesPrefix(path, fullPrefixes)) {
      fullPaths.push(path);
      continue;
    }
    if (matchesExact(path, targetedExact) || matchesPrefix(path, targetedPrefixes)) {
      targetedPaths.push(path);
    }
  }

  if (fullPaths.length > 0) {
    return Object.freeze({ profile:'full', requiresBrowser:true, requiresMenuBrowser:true, requiresTargetedBrowser:false, requiresFullBrowser:true, matchedPaths:fullPaths, affectedRoutes:[], reason:'shared-public-surface-change' });
  }

  if (menuPaths.length > 0) {
    return Object.freeze({ profile:'menu', requiresBrowser:true, requiresMenuBrowser:true, requiresTargetedBrowser:false, requiresFullBrowser:false, matchedPaths:menuPaths, affectedRoutes:[], reason:'megamenu-surface-change' });
  }

  if (targetedPaths.length > 0) {
    const affectedRoutes = [...new Set(targetedPaths.map(routeForPath).filter(Boolean))];
    return Object.freeze({ profile:'targeted', requiresBrowser:true, requiresMenuBrowser:false, requiresTargetedBrowser:true, requiresFullBrowser:false, matchedPaths:targetedPaths, affectedRoutes:affectedRoutes.length ? affectedRoutes : ['/'], reason:'page-local-public-surface-change' });
  }

  return Object.freeze({ profile:'none', requiresBrowser:false, requiresMenuBrowser:false, requiresTargetedBrowser:false, requiresFullBrowser:false, matchedPaths:[], affectedRoutes:[], reason:'no-public-surface-change' });
}
