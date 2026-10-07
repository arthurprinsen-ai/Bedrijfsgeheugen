# 2026-10-07 — Netlify native Git primary authority

## Observed failure

Protected main commit `d18db4301a2ef7b8f6599e17596f7dcac95a8627` started Production Source Snapshot run `37664276888`.

The workflow:
- derived deployment applicability correctly;
- packaged the exact source correctly;
- reused the verified Required prebuilt artifact correctly;
- then failed at the eager GitHub-OIDC/Supabase bridge acquisition with HTTP 420.

Bridge semantics identify HTTP 420 as `composio_netlify_account_not_public`.

## Provider truth

The Netlify MCP connection exists and is ACTIVE, but it is PRIVATE to the interactive Composio connection. The Supabase bridge uses project authority and therefore cannot assume that private connection is discoverable.

Netlify's native Git integration independently remained healthy:
- exact commit: `d18db4301a2ef7b8f6599e17596f7dcac95a8627`;
- production deploy: `6ac68a2989e60100089d4ad8`;
- deploy state: `ready`;
- Production Release Readback `37664276918`: success;
- Self-Heal `37664348507` and `37664442384`: success.

## Prevention

Native Git becomes the primary production authority. The workflow now performs bounded exact-SHA production readback before attempting any JIT bridge side effect. OIDC/JIT remains one fail-closed exact-source fallback. The duplicate linked-build trigger path is retired.

Canonical regression: `tests/brain-netlify-git-deploy-first-v1.test.mjs`.

Terminal acceptance: exact-head Required + CodeQL, protected merge, post-merge control-plane green, and subsequent applicable production delivery must prefer native Git and only enter JIT fallback after bounded non-convergence.

## Protected runtime canary

Canary `netlify-native-git-primary-runtime-20261007-v1` changes only an invisible HTML comment in `index.html`. It exists solely to prove the merged native-Git-first authority against real production.

Required evidence after protected merge:
- exact canary merge SHA is the ready Netlify production `commit_ref`;
- Production Source Snapshot sees that SHA during the native Git wait and exits before JIT fallback;
- no `NETLIFY_NATIVE_GIT_PRIMARY_TIMEOUT` or bridge acquisition is executed;
- Production Release Readback is successful for the same SHA.
