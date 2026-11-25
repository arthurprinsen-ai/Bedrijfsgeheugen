# Development ledger — production-supersession-verifier-only-20261005-v1

- Parent obligation: production-runtime-applicability-20261005-v1.
- Originating PR: #3788.
- Current main: eb51760dc95db37b8e2ee1f02b30134dbc035782.
- Netlify production deploy: 6ac3eae7a5a0b8000855de71, ready/current, commit_ref eb51760dc95db37b8e2ee1f02b30134dbc035782.
- Production Release Readback on main: success.
- Canonical brand shell live readback: failed because verifier-only descendant paths were misclassified by production-supersession.
- Root cause: duplicated applicability policy with inconsistent exact-path sets.
- Fix: add the canonical verifier-only exact paths to production supersession and regression-test verifier-only vs runtime descendants.
- Closure condition: exact-HEAD CI green -> protected merge -> canonical brand shell live readback success -> terminal production truth.
