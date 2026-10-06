# 2026-10-05 — Supabase migration repair parser v2

Issue: #3742

Observed trusted-main run failure: production transport via GitHub OIDC succeeded and the supported Supabase CLI reached the linked database. The control stopped before mutation with `UNEXPECTED_PRE_REPAIR_DRIFT:[]` even though the CLI table visibly showed the four expected local-only versions.

Root cause: the table renderer surrounded migration version values with backticks; the parser validated the unnormalized cells as bare 14-digit strings.

Action: normalize presentation backticks in both before/after parsers, preserve all allowlists and fail-closed rules, and add regression coverage. This evidence records the control-plane lesson; it does not claim production repair or terminal closure.
