# 2026-10-06 — Supabase Edge production credential readiness

Obligation: `supabase-edge-production-credential-readiness-20261006-v1`

Observed:
- protected-main authority workflow run `37461804855` started from main;
- checkout and main-authority checks reached the credential boundary;
- deployment stopped with `SUPABASE_ACCESS_TOKEN_REQUIRED_FOR_PROTECTED_MAIN_PROMOTION`;
- the production publisher/recovery runtime was reconciled to current main, but future autonomous promotion still required durable credential provisioning.

Implemented:
- scope before credential enforcement;
- explicit credential-readiness evidence artifact;
- fail-closed only for applicable promotion;
- safe-descendant handling for unrelated main movement;
- hard failure when newer Supabase runtime/config supersedes the candidate;
- self-trigger for authority workflow changes;
- exact-function manual replay remains available after credential provisioning.

Terminal criterion:
- exact-HEAD gates;
- protected merge;
- one-time GitHub production-environment token provisioning;
- workflow_dispatch exact current-main function replay;
- provider source download equals protected-main source.
