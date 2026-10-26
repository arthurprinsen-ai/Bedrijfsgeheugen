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
