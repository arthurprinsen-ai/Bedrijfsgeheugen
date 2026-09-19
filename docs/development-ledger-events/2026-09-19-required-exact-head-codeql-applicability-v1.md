# Required exact-head CodeQL applicability v1

- Date: 2026-09-19
- Obligation-ID: required-exact-head-codeql-applicability-v1
- Trigger: rebased PR #2327 changes only `data/regulatory-source-state.json`; Powerhouse CodeQL has path filters and therefore does not start.
- Root cause: #2339 made CodeQL evidence unconditional in the required aggregator.
- Change: keep BRAIN unconditional, derive CodeQL applicability from changed PR filenames, and require CodeQL only when its workflow is expected to run.
- Cost control: no duplicate CodeQL dispatches; existing sibling runs remain the only evidence source.
