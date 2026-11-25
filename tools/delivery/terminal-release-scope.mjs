import { readFileSync } from 'node:fs';
import { isNonProductionPath, isNetlifyRuntimePath } from '../site-shell/production-supersession.mjs';

// Reuse the existing production truth authority; no second allowlist or truth store.
const truth = JSON.parse(readFileSync(new URL('../../brain/contracts/production-readback-v1.json', import.meta.url), 'utf8')).productionTruth;
const verifierOnlyPrefixes = truth.verifierOnlyPrefixes || [];
const verifierOnlyExact = new Set(truth.verifierOnlyPaths || []);
const isVerifierOnly = path => verifierOnlyExact.has(path) || verifierOnlyPrefixes.some(prefix => path.startsWith(prefix));

export function classifyTerminalReleaseScope(changedPaths = []) {
  const paths=[...new Set(changedPaths.map(path=>String(path||'').trim()).filter(Boolean))];
  if (!paths.length) throw new Error('TERMINAL_MERGE_CHANGE_SCOPE_EMPTY');

  // Deployment tooling is control-plane code, never a deployed website/runtime.
  // Keep unknown application paths fail-closed; do not blanket-ignore tools/.
  const controlPlanePrefixes=['tools/delivery/','tools/supabase/'];
  const runtime=paths.filter(path=>!isNonProductionPath(path) &&
    !isVerifierOnly(path) &&
    !controlPlanePrefixes.some(prefix=>path.startsWith(prefix)));
  const isEdge=path=>path==='supabase/config.toml'||path.startsWith('supabase/functions/');
  return Object.freeze({
    website:runtime.some(isNetlifyRuntimePath),
    edge:runtime.some(isEdge),
    other:runtime.some(path=>!isNetlifyRuntimePath(path)&&!isEdge(path)),
    non_runtime:runtime.length===0
  });
}

/**
 * A migration is provider-verifiable when every other changed file is
 * already a non-production/control-plane path under the canonical contract.
 * This deliberately fails closed for unknown runtime, website and Edge paths.
 */
export function isMigrationAndNonRuntimeScope(changedPaths = []) {
  const paths = [...new Set(changedPaths.map(path => String(path || '').trim()).filter(Boolean))];
  const migration = /^supabase\/migrations\/[0-9]{14}_[a-z0-9_]+\.sql$/;
  if (!paths.some(path => migration.test(path))) return false;
  const nonMigration = paths.filter(path => !migration.test(path));
  return nonMigration.length === 0 || classifyTerminalReleaseScope(nonMigration).non_runtime;
}
