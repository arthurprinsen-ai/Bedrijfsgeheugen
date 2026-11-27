import { readCanonicalProductionReleaseIdentity } from '../ci/portal-canonical-browser-release-fence.mjs';
// Pure, fail-closed release applicability based on the last *actually published*
// Netlify source. A docs-only HEAD does not erase earlier unshipped runtime diffs.
const validSha=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const unique=values=>[...new Set((Array.isArray(values)?values:[]).map(String).filter(Boolean))];

export function reconcileNetlifyLiveGap({
  headSha,
  parentChangedPaths=[],
  publishedSha=null,
  publishedIsAncestor=false,
  publishedChangedPaths=[],
}={}){
  const parent=unique(parentChangedPaths);
  if(!validSha(headSha)){
    return Object.freeze({reason:'invalid-head',forceDeployment:true,
      changedPaths:Object.freeze(parent),publishedParity:false});
  }
  if(validSha(publishedSha)&&publishedSha===headSha){
    return Object.freeze({reason:'production-already-exact',forceDeployment:false,
      changedPaths:Object.freeze([]),publishedParity:true});
  }
  if(validSha(publishedSha)&&publishedIsAncestor&&Array.isArray(publishedChangedPaths)){
    return Object.freeze({reason:'unpublished-ancestry-diff',forceDeployment:false,
      changedPaths:Object.freeze(unique([...publishedChangedPaths,...parent])),publishedParity:false});
  }
  // No provider readback, bad SHA or diverged release: never infer no work
  // solely from a governance-only last commit.
  return Object.freeze({reason:'unverified-production-state',forceDeployment:true,
    changedPaths:Object.freeze(parent),publishedParity:false});
}

/** RDI-1: source identity is not runtime health. Never accept a preview marker. */
export function publishedProductionSha(marker) {
  return marker?.contract === 'BRAIN-DELIVERY-v2' && marker.context === 'production'
    && typeof marker.deploy_id === 'string' && /^[0-9a-f]{24}$/.test(marker.deploy_id)
    && validSha(marker.commit_ref)
    ? marker.commit_ref : null;
}

/** Advisory, bounded recovery priority; a score never grants execution authority. */
export function releaseRecoveryScore({eligible,probability,driftMinutesAvoided,value,
  recoveryMinutes,costMinutes}={}) {
  const inputs=[probability,driftMinutesAvoided,value,recoveryMinutes,costMinutes];
  if(eligible!==true || !inputs.every(Number.isFinite) || probability<0 || probability>1
    || driftMinutesAvoided<0 || value<0 || recoveryMinutes<=0 || costMinutes<0) return null;
  const score=probability*driftMinutesAvoided*value/(recoveryMinutes+costMinutes);
  return Number.isFinite(score)?score:null;
}

/** Keep exact source parity distinct from the independently classified runtime impact. */
export function releaseDriftStatus({headSha,publishedSha,ancestor,requiresDeployment,ageMinutes}={}) {
  if(!validSha(headSha)||!validSha(publishedSha)) return 'UNKNOWN';
  if(headSha===publishedSha) return 'SHA_MATCHED_NEEDS_READBACK';
  if(ancestor!==true||typeof requiresDeployment!=='boolean') return 'UNKNOWN';
  if(!requiresDeployment) return 'SOURCE_ONLY_DRIFT';
  if(!Number.isFinite(ageMinutes)||ageMinutes<0) return 'RUNTIME_DRIFT_AGE_UNKNOWN';
  return ageMinutes>=15?'P0_RUNTIME_DRIFT':ageMinutes>=5?'WARN_RUNTIME_DRIFT':'RUNTIME_DRIFT';
}

/** Reuse canonical/immutable fence with a shared deadline. Unknown requires a build. */
export async function readVerifiedPublishedSha({fetchImpl=globalThis.fetch,timeoutMs=6000}={}) {
  try {
    if(typeof fetchImpl!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<=0||timeoutMs>6000)return null;
    const signal=AbortSignal.timeout(timeoutMs);
    const proof=await readCanonicalProductionReleaseIdentity({fetchImpl:async (url,options)=>{
      signal.throwIfAborted();
      const res=await fetchImpl(url,{...options,signal,redirect:'error',cache:'no-store'});
      signal.throwIfAborted();
      if(res?.url&&res.url!==url)throw Error('RELEASE_REDIRECT_UNVERIFIED');
      return res;
    }});
    if(signal.aborted||proof?.independent_release_manifests!==2||proof.state!=='ready')return null;
    return publishedProductionSha({contract:'BRAIN-DELIVERY-v2',context:proof.context,deploy_id:proof.id,commit_ref:proof.commit_ref});
  } catch {return null;}
}
