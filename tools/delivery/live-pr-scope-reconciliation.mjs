const SHA=/^[a-f0-9]{40}$/i;
const protectedEvent=new Set(['pull_request','workflow_dispatch']);

/**
 * For an unchanged PR head, current GitHub PR base is the only safe scope base.
 * GitHub's immutable pull_request event may carry an OLD base SHA when main moved.
 * Never widen scope, relabel a head, or rely on arbitrary branch names.
 */
export function reconcileLivePrScope({eventName,prNumber,eventBaseSha,eventHeadSha,livePr}={}){
 if(!protectedEvent.has(eventName)||!prNumber)throw Error('REQUIRED_LIVE_PR_CONTEXT_MISSING');
 if(!livePr||String(livePr.number)!==String(prNumber)||livePr.state!=='open'
  ||livePr.base?.ref!=='main'||!SHA.test(String(livePr.base?.sha||''))
  ||!SHA.test(String(livePr.head?.sha||''))
  ||!SHA.test(String(eventBaseSha||''))||!SHA.test(String(eventHeadSha||'')))
  throw Error('REQUIRED_LIVE_PR_PROVIDER_IDENTITY_UNVERIFIED');
 if(livePr.head.sha!==eventHeadSha)throw Error('REQUIRED_LIVE_PR_HEAD_CHANGED_RETRY_EXACT_HEAD');
 return Object.freeze({
  baseSha:livePr.base.sha,
  headSha:livePr.head.sha,
  baseDrift:livePr.base.sha!==eventBaseSha,
  proof:'GITHUB_LIVE_OPEN_PR_SAME_HEAD_BASE_MAIN'
 });
}
