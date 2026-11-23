const SHA_RE = /^[a-f0-9]{40}$/i;

export function resolveReleaseCommitRef({ env = {}, markerText = '' } = {}) {
  const commitRef = String(env.COMMIT_REF || '').trim();
  const head = String(env.HEAD || '').trim();
  const marker = String(markerText || '').trim();

  const envRef = SHA_RE.test(commitRef) ? commitRef : (SHA_RE.test(head) ? head : '');
  const markerRef = SHA_RE.test(marker) ? marker : '';

  if (envRef && markerRef && envRef.toLowerCase() !== markerRef.toLowerCase()) {
    throw new Error('RELEASE_SOURCE_IDENTITY_MISMATCH env=' + envRef + ' marker=' + markerRef);
  }
  const resolved = envRef || markerRef;
  if (!SHA_RE.test(resolved)) {
    throw new Error('RELEASE_SOURCE_IDENTITY_MISSING: valid COMMIT_REF/HEAD or .bg-source-commit is required');
  }
  return resolved;
}

/**
 * Preserve the source-identity decision made by bouw-release-evidence at the
 * final Netlify build boundary. A valid-looking 40-hex temporary Git HEAD is
 * never authority by itself: API uploads carry the original .bg-source-commit
 * and native Git's HEAD-only fallback needs independently matching origin/main.
 */
export function resolveFinalReleaseIdentity({
  env = {}, markerText = '', existingRelease = null,
  gitHead = '', gitOrigin = '', gitRemoteMain = '',
} = {}) {
  const marker=String(markerText||'').trim();
  const provided=String(env.COMMIT_REF||'').trim();
  const existing=String(existingRelease?.commit_ref||'').trim();
  if(marker&&!SHA_RE.test(marker)) throw new Error('PRODUCTION_RELEASE_MARKER_INVALID');
  if(provided&&!SHA_RE.test(provided)) throw new Error('PRODUCTION_RELEASE_COMMIT_REF_INVALID');
  const selected=resolveReleaseCommitRef({env,markerText:marker});
  if(!SHA_RE.test(existing)||existing.toLowerCase()!==selected.toLowerCase()){
    throw new Error('PRODUCTION_RELEASE_EVIDENCE_SOURCE_MISMATCH');
  }
  if(!marker&&!provided){
    const validOrigin=/^(?:https?:\/\/github\.com\/|git@github\.com:)arthurprinsen-ai\/Bedrijfsgeheugen(?:\.git)?\/?$/i.test(String(gitOrigin||'').trim());
    const head=String(gitHead||'').trim();
    const main=String(gitRemoteMain||'').trim();
    if(!validOrigin||!SHA_RE.test(head)||!SHA_RE.test(main)||
       head.toLowerCase()!==selected.toLowerCase()||
       main.toLowerCase()!==selected.toLowerCase()){
      throw new Error('PRODUCTION_RELEASE_UNATTESTED_HEAD_FALLBACK');
    }
  }
  return selected.toLowerCase();
}
