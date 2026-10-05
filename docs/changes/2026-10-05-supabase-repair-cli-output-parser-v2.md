# Supabase repair CLI output parser v2

## Incident

The trusted-main repair reached the Supabase production database through the GitHub OIDC bridge successfully, but stopped before `migration repair`.

The provider CLI printed migration versions as backtick-rendered table cells. The guard only accepted bare 14-digit values, so the four visible local-only replay baselines were discarded during parsing and the workflow raised `UNEXPECTED_PRE_REPAIR_DRIFT:[]`.

## Structural fix

The repair workflow now strips backticks before splitting and validating CLI table cells. The exact four-version allowlist, OIDC transport, supported `supabase migration repair --status applied --db-url` command, and post-repair zero-drift proof remain unchanged.

The regression test now requires `--db-url` semantics and parser normalization.

## Terminal contract

This parser fix is only a prerequisite. After protected merge, trusted main must rerun the repair, prove the production ledger contains all four replay identities, force-with-lease advance #3766, and #3766 must still pass fresh replay, exact-HEAD gates, protected merge, and post-merge readback.
