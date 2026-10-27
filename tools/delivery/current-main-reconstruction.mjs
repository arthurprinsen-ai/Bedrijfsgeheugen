/**
 * Advisory-only, deterministic current-main reconstruction planner.
 * No branch mutation, force pushes, gate waivers or synthetic green results.
 */
export function planCurrentMainReconstruction({pulls, mainSha}) {
  if (!/^[a-f0-9]{40}$/i.test(mainSha)) throw new Error('MAIN_SHA_REQUIRED');
  if (!Array.isArray(pulls)) throw new TypeError('PULLS_REQUIRED');
  return pulls.map(pr => {
    const behind = pr.behind_by;
    const authorized = pr.sameRepository === true && pr.optedIn === true && pr.writerLeaseOwned === true;
    if (!Number.isSafeInteger(behind) || behind < 0) return {number:pr.number, action:'READ_ONLY', reason:'UNVERIFIED_DRIFT'};
    if (behind === 0) return {number:pr.number, action:'CHECK_EXACT_HEAD', reason:'CURRENT_MAIN'};
    if (!authorized) return {number:pr.number, action:'OWNER_HANDOFF', reason:'NO_WRITER_AUTHORITY', behind};
    if (pr.draft === true && pr.allowDraftReconstruction !== true) return {number:pr.number, action:'OWNER_HANDOFF', reason:'DRAFT_REQUIRES_OWNER_DECISION', behind};
    if (!Array.isArray(pr.changedFiles) || pr.changedFiles.length === 0 || !pr.changedFiles.every(p=>typeof p==='string' && p.length>0)) return {number:pr.number, action:'OWNER_HANDOFF', reason:'SCOPE_UNKNOWN', behind};
    if (pr.changedFiles.some(p=>p==='platform/system-map/canonical-system-map.mjs')) return {number:pr.number, action:'OWNER_HANDOFF', reason:'CANONICAL_SYSTEM_MAP_SHARED_WRITE', behind};
    return {number:pr.number, action:'PROPOSE_RECONSTRUCTION', reason:'SOURCE_DELTA_ON_CURRENT_MAIN', behind, base:mainSha, changedFiles:[...new Set(pr.changedFiles)].sort(), required:['portal-explanation-inventory --write','portal-explanation-inventory --check','Required','BRAIN','CodeQL','protected merge','production provider readback']};
  });
}
