# Daily commercial provider-URN assurance — 2026-10-08

- **Obligation:** `commercial-social-provider-urn-proof-20261008-v1`.
- **Canonical owner:** `powerhouse_commercial_output_assurance_v1` in Brain, consumed by the existing Heartbeat.
- **Verified upstream commercial acts:** 8 October live blog and LinkedIn company provider post `urn:li:share:7513894237386719236`.
- **Root defect:** LinkedIn API can return an exact verified provider URN without an optional `canonical_url`; legacy Brain silently undercounted that production post.
- **Change scope:** one backward-compatible migration, executable regression, learning, human change note, and append-only delivery ledger.
- **Protected proof:** rollback schema execution observed two provider-proven publications while original production function still counted one.
- **Fail-closed:** no fabricated revenue or email; LinkedIn org scopes, provider readback and exact identity necessary; blog URL and Instagram media policy remain strict.
- **Pending:** protected PR #4128 Required + CodeQL, official isolated Supabase Preview, protected merge, production migration and first natural external Heartbeat readback.
- **Execution constraints:** do not repeatedly push while the provider's exact-head preview is active; no force-merge, branch-protection bypass, duplicate scheduler or sender.
