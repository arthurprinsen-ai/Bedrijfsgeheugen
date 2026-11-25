# Terminalizer repository-only readback contract

PR #3984 protected-merged with its final Required and Powerhouse CodeQL gates green. The post-merge terminalizer then failed closed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` because repository-only control-plane files were not represented consistently in the runtime-readback classifier.

This recovery centralizes verifier-only classification in `brain/contracts/production-readback-v1.json`:

- safe repository-only roots use `verifierOnlyPrefixes`;
- control-plane config remains exact-path only, so all of `config/` is **not** broadly exempted;
- the terminalizer consumes the contract instead of growing another hardcoded path list;
- unknown non-Netlify and non-Supabase runtime paths remain fail-closed.

After protected merge, the terminalizer replays immutable merged PR #3984 and must produce terminal evidence against the already-merged lineage.
