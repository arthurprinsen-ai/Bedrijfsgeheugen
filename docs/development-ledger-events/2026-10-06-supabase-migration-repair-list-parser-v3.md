# 2026-10-06 — Supabase migration repair parser v3

Issue: #3742

Trusted-main run 37425004020 proved GitHub OIDC database transport and the four-version effect-evidence allowlist, then stopped before provider mutation with `REMOTE_ONLY_OR_IDENTITY_DRIFT`.

Readback of the actual Supabase CLI table showed exactly four local-only rows:
- 20260920101150
- 20260920102450
- 20260925080500
- 20261005133951

Each empty remote cell was rendered as ` `. The v2 parser removed backticks after its only trim, leaving one residual space and incorrectly treating the remote side as populated.

Action: normalize every cell with trim, strip presentation backticks, then trim again; regression-test the exact provider representation; preserve all fail-closed repair constraints. No production mutation occurred in the failed run or in this parser change.
