import { isNonProductionPath, isNetlifyRuntimePath } from '../site-shell/production-supersession.mjs';

export function classifyTerminalReleaseScope(changedPaths = []) {
  const paths=[...new Set(changedPaths.map(path=>String(path||'').trim()).filter(Boolean))];
  if (!paths.length) throw new Error('TERMINAL_MERGE_CHANGE_SCOPE_EMPTY');

  // Deployment tooling is control-plane code, never a deployed website/runtime.
  // Keep unknown application paths fail-closed; do not blanket-ignore tools/.
  const controlPlanePrefixes=['tools/delivery/','tools/supabase/'];
  const runtime=paths.filter(path=>!isNonProductionPath(path) &&
    !controlPlanePrefixes.some(prefix=>path.startsWith(prefix)));
  const isEdge=path=>path==='supabase/config.toml'||path.startsWith('supabase/functions/');
  return Object.freeze({
    website:runtime.some(isNetlifyRuntimePath),
    edge:runtime.some(isEdge),
    other:runtime.some(path=>!isNetlifyRuntimePath(path)&&!isEdge(path)),
    non_runtime:runtime.length===0
  });
}
