# Interaction Quality Gate CI expectations

The PR is expected to prove, not assume, the following before merge:

- `test` runs the existing Brain/delivery regressions, the current V18 comparer regression, all new interaction static contracts, and the canonical Playwright interaction suite against the Netlify deploy preview.
- `interaction-quality-gate` independently runs the same static/browser interaction suite for explicit diagnostics.
- Netlify deploy-preview must succeed for the PR head SHA before browser assertions run.
- Any browser failure must emit contract id, route, viewport and failure class through the attached diagnostic JSON where Playwright reaches the assertion layer.
- Production readback is only meaningful after merge/deploy and reuses the exact same browser spec.

A green static-only result is insufficient; the browser portion of `test` must also complete successfully on the deploy preview.
