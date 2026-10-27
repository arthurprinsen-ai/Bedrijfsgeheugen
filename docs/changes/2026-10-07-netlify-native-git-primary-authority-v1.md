# Netlify native Git primary authority v1

Production delivery now uses one clear order of authority:

1. Netlify's existing native Git integration is primary.
2. Production Source Snapshot waits boundedly for the exact main SHA in `release.json`.
3. Only when that readback does not converge does GitHub acquire OIDC and call the Supabase JIT bridge.
4. The JIT bridge remains the single exact-source MCP fallback and fails closed when provider authority is unavailable.

## Why

Production Source Snapshot run `37664276888` failed before deployment at the eager bridge-acquisition step with HTTP 420. GitHub OIDC itself worked. The bridge classified the failure as an unavailable public/project-visible Netlify Composio account.

At the same time, Netlify's native Git integration was healthy: commit `d18db4301a2ef7b8f6599e17596f7dcac95a8627` became production deploy `6ac68a2989e60100089d4ad8`, and Production Release Readback run `37664276918` succeeded.

The active Netlify MCP connection is PRIVATE, so a Supabase-side Composio project key must not be allowed to pre-empt a healthy native Git deployment.

## Structural change

- removes the eager standalone bridge-acquisition step;
- waits up to a bounded native-Git window before fallback;
- removes the redundant linked-build trigger path;
- retains one OIDC/JIT exact-source MCP fallback;
- classifies non-200 JIT responses explicitly and rechecks production for a race before failing;
- keeps exact-SHA production identity/readback authoritative.

No new scheduler, secret store, deployment lane, or customer-facing runtime is introduced.

## Runtime canary

A protected one-line invisible HTML comment named `netlify-native-git-primary-runtime-20261007-v1` is used to exercise the real website deployment path without changing customer-visible content or behavior.

Acceptance is exact and provider-backed: the canary merge SHA must become Netlify production through native Git while Production Source Snapshot is still inside `NETLIFY_NATIVE_GIT_PRIMARY_WAIT`; the timeout/JIT fallback markers must not be reached, and Production Release Readback must succeed on the same SHA.

## Runtime proof

The protected canary merged as `cfbf6247cd59506d468dd75bca0307c3065b4f67` and is now provider-proven live.

- Netlify deploy: `6ac692d18140b50008e74167`;
- provider state/context: `ready / production`;
- provider `commit_ref`: `cfbf6247cd59506d468dd75bca0307c3065b4f67`;
- Production Source Snapshot run `37669016310`: success;
- the executed snapshot log entered `NETLIFY_NATIVE_GIT_PRIMARY_WAIT` and observed the exact SHA live before timeout;
- the job exited with “no transport side effect required”, so the JIT fallback was not invoked;
- Production Release Readback run `37669016607`: success.

This closes the authority ordering as `LIVE_PROVEN`: native Git is primary in real production, while OIDC/JIT remains fallback-only.
