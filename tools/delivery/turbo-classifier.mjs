export const MAX_TURBO_PATHS = 24;

export const TURBO_BLOCKERS = [
  /^\.github\/workflows\//,
  /^supabase\/migrations\//,
  /^supabase\/schema(?:\/|\.sql$)/,
  /^netlify\.toml$/,
  /^_redirects$/,
  /^package(?:-lock)?\.json$/,
  /^config\/brain-delivery-system\.json$/,
  /^config\/powerhouse-delivery-hygiene-v1\.json$/,
  /^brain\/production\//,
  /^tools\/delivery\//,
  /^tools\/brain-delivery-system\.mjs$/,
  /auth/i,
  /security/i,
  /rls/i,
  /permission/i,
  /secret/i
];

export function classifyTurboDelivery({changedPaths=[], labels=[]}={}) {
  const paths=[...new Set(changedPaths.filter(Boolean))];
  const forcedCritical=labels.includes('delivery:critical') || labels.includes('security');
  const forcedTurbo=labels.includes('delivery:turbo');
  const blockers=paths.filter(path=>TURBO_BLOCKERS.some(re=>re.test(path)));
  const tooWide=paths.length===0 || paths.length>MAX_TURBO_PATHS;
  const turboEligible=!forcedCritical && !tooWide && blockers.length===0;
  return {
    class: turboEligible ? 'TURBO' : (forcedCritical ? 'CRITICAL' : 'STANDARD'),
    turbo: turboEligible,
    forcedTurboAccepted: forcedTurbo && turboEligible,
    changedPathCount: paths.length,
    maxTurboPaths: MAX_TURBO_PATHS,
    blockers,
    reason: turboEligible ? 'bounded_non_infrastructure_change' :
      forcedCritical ? 'critical_label' :
      tooWide ? 'scope_too_wide' :
      'protected_surface_touched'
  };
}
