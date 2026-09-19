# Runtime authority cleanup — retired Make bindings

- Obligation-ID: github-cleanup-runtime-authority-drift-v1
- Source issue: #1884
- Root cause: the generated component registry remained on a 2026-08-28 snapshot and still represented PH Agent 01–16 historical Make workers as active after the canonical runtime authority retired the Make estate.
- Fix: component registry v2 now identifies the canonical runtime authority version/fingerprint and classifies PH Agent 01–16 as `legacy_retired_path`, `authority=NONE`, `runtime=make`, `production_execution_allowed=false`.
- Prevention: deterministic regression fails if any retired PH agent regains active execution authority or if registry authority metadata drifts from the canonical runtime contract.
- Historical scenario IDs remain provenance; this change does not delete audit history.
