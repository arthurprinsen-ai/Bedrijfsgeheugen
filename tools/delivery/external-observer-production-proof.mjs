const SHA_RE=/^[0-9a-f]{40}$/i;

function asString(value){
  return String(value ?? '').trim();
}

export function evaluateExternalObserverProductionProof({
  expectedSha,
  deploy,
  expectedAlias='https://www.bedrijfsgeheugen.nl',
  expectedFunctions=[],
  githubLineageVerified=false,
  externalObserverStatus='UNAVAILABLE',
}={}){
  const expected=asString(expectedSha).toLowerCase();
  if(!SHA_RE.test(expected)) throw new Error('expectedSha must be a 40-character Git SHA');
  if(!deploy || typeof deploy!=='object') throw new Error('deploy is required');
  if(githubLineageVerified!==true) throw new Error('immutable GitHub lineage is not verified');

  const state=asString(deploy.state).toLowerCase();
  const context=asString(deploy.context).toLowerCase();
  const commitRef=asString(deploy.commit_ref).toLowerCase();
  const deployId=asString(deploy.id);
  const alias=asString(deploy?.links?.alias || deploy.ssl_url || deploy.url);
  const observer=asString(externalObserverStatus).toUpperCase();

  if(state!=='ready' && state!=='current') throw new Error(`Netlify deploy is not ready/current: ${state||'missing'}`);
  if(context!=='production') throw new Error(`Netlify deploy context is not production: ${context||'missing'}`);
  if(!deployId) throw new Error('Netlify deploy id is missing');
  if(alias!==expectedAlias) throw new Error(`Netlify production alias mismatch: ${alias||'missing'}`);
  if(!SHA_RE.test(commitRef)) throw new Error('Netlify commit_ref must be a 40-character Git SHA');
  if(commitRef!==expected) throw new Error(`Netlify commit_ref mismatch: expected ${expected}, observed ${commitRef}`);

  const available=Array.isArray(deploy.available_functions)
    ? new Set(deploy.available_functions.map(item=>asString(item?.n || item?.name)).filter(Boolean))
    : new Set();
  const missing=expectedFunctions.map(asString).filter(Boolean).filter(name=>!available.has(name));
  if(missing.length) throw new Error(`Expected Netlify functions missing from provider inventory: ${missing.join(',')}`);

  return {
    status:'LIVE_PROVEN_PROVIDER_TRUTH',
    proof_mode:'netlify_provider_truth',
    observer_status:observer || 'UNKNOWN',
    observer_authoritative:false,
    provider:'netlify',
    deploy_id:deployId,
    state,
    context,
    alias,
    commit_ref:commitRef,
    expected_functions:expectedFunctions,
    function_inventory_verified:expectedFunctions.length===0 || missing.length===0,
    github_lineage_verified:true,
  };
}
