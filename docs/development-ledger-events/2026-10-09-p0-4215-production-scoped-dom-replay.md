# P0 #4215 delivery event — scope-aware production verification

- Existing-state-only: reuse protected GitHub main, Git diff/merge ancestry, approved production portal workflow and exact immutable Netlify release.
- Defect: a release verification workflow repaired in a CI-only commit could not re-check the previous runtime deployment because it expected the newest workflow commit SHA to be published by Netlify, even though no runtime files changed.
- Corrective contract: accept optional *explicit main dispatch* production SHA only when it is an ancestor of main and the intervening diff is CI/evidence-only; fail on any affected portal/runtime code. Perform full DOM, mobile and strict visual baseline comparison on exact published commit and matched merged PR.
- Evidence must be read back from current provider; no synthetic Netlify release or claimed deployment of newer CI-only workflow SHA.
- Test: `tests/brain-p0-4215-production-scoped-dom-readback-v1.test.mjs` in historical/shadow/canary, always-on Required preflight.
- Parent P0 customer, outbox and CSRD legal acceptance remain independent.
