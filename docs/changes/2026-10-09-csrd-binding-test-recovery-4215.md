# CSRD state binding contract regression recovery

PR #4225 merged code that correctly passes a second `demo` context parameter to `impactSnapshotFromPortalState`. The existing source-contract test `portal-v2/tests/csrd-state-binding.test.mjs` still required exactly one argument and rejected this intentional fail-closed tenant behavior, leaving 519 of 520 portal tests green. This is a test expectation defect, not grounds to roll back the live tenant safeguard.

The source-contract assertion now checks that the real customer snapshot is used **and** that demo values require a demo route or no signed-in identity. The test was verified against the branch's `page-shell.js` source before submission.

`netlify.toml` contains an inert native deploy heartbeat to preserve exact-main release consistency when this contract-only correction is merged. Neither production authorization nor the legal CSRD scope was altered. Official source applicability and authenticated two-tenant readback remain open in #4215.