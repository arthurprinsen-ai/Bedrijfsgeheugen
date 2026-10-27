# Terminalizer tools/ci governance classification

PR #3952 protected-merged the canonical Netlify applicability authority, with Required and CodeQL green. Its post-merge terminalizer failed only because `tools/ci/netlify-ignore-build.mjs` was still classified as unknown runtime.

This change adds `tools/ci/*` to the existing governance-only classifier. The runtime safety boundary remains fail-closed: unknown non-governance paths still emit `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.

After merge, the terminalizer replays PR #3952 so the already-merged Netlify applicability change receives terminal proof without another product/runtime mutation.
