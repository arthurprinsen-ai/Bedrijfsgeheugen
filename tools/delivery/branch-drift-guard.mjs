// Deterministic, fail-closed advisory for the existing single-writer delivery controller.
// Never equate "commits behind" with a need to rebuild; only conflicting contracts
// justify a protected update. Provider inputs must be complete and exact-head bound.
import {evaluateBranchDrift,deriveConflictContracts} from '../brain-delivery-system.mjs';
const SHA=/^[a-f0-9]{40}$/i;
const uniq=x=>[...new Set(x)].sort();
export function assessBranchDrift({headSha,mainSha,behindBy,mergeable,headIntegrated=false,featurePaths,mainDriftPaths,policy,snapshotComplete=false,prOpen=true,writerLeaseActive=false}={}){
  const invalid=!SHA.test(headSha||'')||!SHA.test(mainSha||'')||
    !Number.isSafeInteger(behindBy)||behindBy<0||typeof mergeable!=='boolean'||
    !Array.isArray(featurePaths)||!Array.isArray(mainDriftPaths)||
    !featurePaths.every(x=>typeof x==='string'&&x.length>0)||
    !mainDriftPaths.every(x=>typeof x==='string'&&x.length>0)||
    !policy||!Array.isArray(policy.conflictContracts)||snapshotComplete!==true;
  if(invalid)return Object.freeze({action:'HOLD_PROVIDER_EVIDENCE',reason:'INCOMPLETE_OR_INVALID_EXACT_HEAD_SNAPSHOT',safeToUpdate:false});
  if(!prOpen)return Object.freeze({action:'NO_ACTION',reason:'PR_NOT_OPEN',safeToUpdate:false});
  if(headIntegrated)return Object.freeze({action:'NO_ACTION',reason:'HEAD_ALREADY_INTEGRATED',safeToUpdate:false});
  if(behindBy===0&&mergeable)return Object.freeze({action:'KEEP_TESTED_FEATURE',reason:'NO_MAIN_DRIFT',safeToUpdate:false});
  const verdict=evaluateBranchDrift({featurePaths:uniq(featurePaths),mainDriftPaths:uniq(mainDriftPaths),featureContracts:deriveConflictContracts(featurePaths,policy),mainDriftContracts:deriveConflictContracts(mainDriftPaths,policy),mergeable});
  if(verdict.action!=='SYNC_REQUIRED')return Object.freeze({...verdict,safeToUpdate:false,behindBy});
  if(writerLeaseActive)return Object.freeze({action:'ESCALATE_TO_CANONICAL_WRITER',reason:'TERMINAL_WRITER_LEASE_ACTIVE',safeToUpdate:false,behindBy,overlap:verdict.overlap,contractOverlap:verdict.contractOverlap});
  return Object.freeze({...verdict,safeToUpdate:true,behindBy,preconditions:Object.freeze({expectedHeadSha:headSha,observedMainSha:mainSha,protectedChecksRequired:true,ownerOnly:true})});
}
