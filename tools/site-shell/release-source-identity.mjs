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
