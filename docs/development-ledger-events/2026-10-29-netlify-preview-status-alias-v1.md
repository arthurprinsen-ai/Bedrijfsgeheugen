# 2026-10-29 — Portal preview check accepts the numbered Netlify alias

- Canonical obligation: `ci-preview|netlify-status-alias|20261029-v1`.
- Defect: `Portal V2 Live Preview` red on every PR since at least 2026-10-27 because Netlify reports the numbered PR alias as status target; silent because the check is not required.
- Scope: one workflow, one regression test, known-error documentation, learning and change notes.
- Helper contract unchanged: aliases remain rejected there; the workflow validates SHA and deploy id itself.
- Required next proofs: exact-head Required/CodeQL, protected merge, the next PR shows the preview check green.
