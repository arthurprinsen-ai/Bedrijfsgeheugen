import { classifyConflict } from './conflict-index.mjs';
import { decideProductionActivation } from './production-authority.mjs';
import { evaluateBranchDrift } from '../../tools/brain-delivery-system.mjs';

const blockingConflict=new Set(['CONTRACT_OVERLAP','MERGE_CONFLICT','HARD_BOUNDARY']);

export function evaluateContinuousChange({candidate={},concurrent=[],registered=false,gatesGreen=false,dependenciesGreen=true,exactEvidence=false,productionRegressed=false,mergeable=true,mainDriftPaths=[]}={}){
  const conflict=classifyConflict(candidate,concurrent);
  let drift={action:'KEEP_TESTED_FEATURE',reason:'not-git-or-no-relevant-drift',overlap:[]};
  if(candidate.platform==='github'){
    drift=evaluateBranchDrift({featurePaths:candidate.changedResources||[],mainDriftPaths,mergeable});
  }
  const conflictBlocks=blockingConflict.has(conflict.state)||drift.action==='SYNC_REQUIRED';
  const production=decideProductionActivation({
    platform:candidate.platform,
    registered,
    gatesGreen:gatesGreen&&!conflictBlocks,
    dependenciesGreen:dependenciesGreen&&!conflictBlocks,
    exactEvidence,
    hardBoundary:conflict.state==='HARD_BOUNDARY'||candidate.hardBoundary===true,
    productionRegressed
  });
  return Object.freeze({
    conflict,
    drift:Object.freeze(drift),
    production,
    rebuildRequired:false,
    waitForUnrelatedChanges:false
  });
}
