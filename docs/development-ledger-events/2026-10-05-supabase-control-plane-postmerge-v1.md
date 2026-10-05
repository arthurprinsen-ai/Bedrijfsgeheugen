# 2026-10-05 — #3742 control-plane post-merge hardening

Observed after merge of PR #3768:
- trusted-main repair resolved #3766 and validated the exact four-version allowlist;
- production mutation did not start because `SUPABASE_ACCESS_TOKEN` and the database password were empty in the production environment;
- Supabase Preview Applicability independently failed with OS `Argument list too long` while passing check-runs JSON via an environment variable.

Changes:
- bounded file-based check-runs payload transport;
- immutable repair preflight evidence before credential checks;
- regression tests for both defects.

This does not mark #3742 terminal. Supported production tracking repair, exact production ledger readback, exact-head gates, protected merge, and post-merge readback remain required.
